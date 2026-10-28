interface Entry { count: number; resetAt: number }

// One object per hashed logical key. Storage transactions preserve existing
// long windows and account lockouts across isolates and Cloudflare locations.
export class SecurityRateLimiter {
  constructor(private state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const data = await request.json() as { action: string; limit?: number; windowMs?: number }
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

  async alarm() {
    const entry = await this.state.storage.get<Entry>('counter')
    if (!entry || entry.resetAt <= Date.now()) await this.state.storage.deleteAll()
    else await this.state.storage.setAlarm(entry.resetAt)
  }
}
