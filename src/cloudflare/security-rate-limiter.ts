interface Entry { count: number; resetAt: number }
interface ReturnGate { attempts: number[]; claim?: { id: string; leaseUntil: number; complete: boolean } }
const RETURN_DAY = 24 * 60 * 60 * 1000

// One object per hashed logical key. Storage transactions preserve existing
// long windows and account lockouts across isolates and Cloudflare locations.
export class SecurityRateLimiter {
  constructor(private state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const payload = await request.json() as Record<string, unknown>
    if (payload.action === 'returns-reserve' || payload.action === 'returns-complete') {
      return this.returnSubmission(payload)
    }
    const data = payload as { action: string; limit?: number; windowMs?: number }
    if (!['check', 'record', 'reset', 'limit'].includes(data.action)) return new Response('Invalid action', { status: 400 })
    const now = Date.now()
    const result = await this.state.storage.transaction(async storage => {
      if (data.action === 'reset') { await storage.delete('counter'); return { locked: false } }
      const stored = await storage.get<Entry>('counter')
      const entry = stored && stored.resetAt > now ? stored : { count: 0, resetAt: now + (data.windowMs ?? 900000) }
      const limit = data.limit ?? 5
      if (data.action === 'check') return { locked: entry.count >= limit, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) }
      const success = entry.count < limit
      if (data.action === 'record' || success) {
        entry.count++
        await storage.put('counter', entry)
        await storage.setAlarm(entry.resetAt)
      }
      return { success, limit, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt,
        ...(!success ? { retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) } : {}) }
    })
    return Response.json(result)
  }

  private async returnSubmission(data: Record<string, unknown>) {
    const now = Date.now()
    const result = await this.state.storage.transaction(async storage => {
      const gate = await storage.get<ReturnGate>('returns') || { attempts: [] }
      gate.attempts = gate.attempts.filter(time => time > now - RETURN_DAY)
      if (data.action === 'returns-complete') {
        if (gate.claim?.id === data.id) gate.claim.complete = true
        await storage.put('returns', gate)
        return { status: 'complete' }
      }
      // A recovered write is settled by its database ID. The same unfinished
      // claim always reuses its _id, so an ambiguous/late retry cannot insert twice.
      const settled = Array.isArray(data.settledIds) ? data.settledIds.slice(0, 3) : []
      if (gate.claim && settled.includes(gate.claim.id)) gate.claim.complete = true
      if (gate.claim && !gate.claim.complete) {
        if (gate.claim.leaseUntil > now) return { status: 'busy' }
        gate.claim.leaseUntil = now + 60_000
      } else {
        if (gate.attempts.length >= 3) return { status: 'limited' }
        gate.attempts.push(now)
        gate.claim = { id: crypto.randomUUID().replaceAll('-', '').slice(0, 24), leaseUntil: now + 60_000, complete: false }
      }
      await storage.put('returns', gate)
      await storage.setAlarm(Math.max(...gate.attempts) + RETURN_DAY)
      return { status: 'reserved', id: gate.claim.id }
    })
    return Response.json(result)
  }

  async alarm() {
    const gate = await this.state.storage.get<ReturnGate>('returns')
    if (gate) {
      const expires = Math.max(...gate.attempts) + RETURN_DAY
      if (expires > Date.now()) { await this.state.storage.setAlarm(expires); return }
    }
    const entry = await this.state.storage.get<Entry>('counter')
    if (!entry || entry.resetAt <= Date.now()) await this.state.storage.deleteAll()
    else await this.state.storage.setAlarm(entry.resetAt)
  }
}
