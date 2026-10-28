'use client'

// Public responses only. No session/account/admin endpoints in this shared cache.
const responses = new Map<string, { expiresAt: number; promise: Promise<unknown> }>()
export function readPublicJson<T>(url: string, ttl = 60_000): Promise<T> {
  const existing = responses.get(url)
  if (existing && existing.expiresAt > Date.now()) return existing.promise as Promise<T>
  if (responses.size >= 50) responses.delete(responses.keys().next().value!)
  const entry = { expiresAt: Date.now() + ttl, promise: Promise.resolve(null) as Promise<unknown> }
  entry.promise = fetch(url, { signal: AbortSignal.timeout(20_000) }).then(async response => {
    if (!response.ok) throw new Error('Public content unavailable')
    const result = await response.json()
    entry.expiresAt = Date.now() + ttl
    return result
  }).catch(error => { if (responses.get(url) === entry) responses.delete(url); throw error })
  responses.set(url, entry)
  return entry.promise as Promise<T>
}
