'use client'

// Public responses only. No session/account/admin endpoints in this shared cache.
type SavedResponse = { body: string; status: number; headers: [string, string][] }
const responses = new Map<string, { expiresAt: number; promise: Promise<SavedResponse> }>()

function assertPublicUrl(url: string) {
  const parsed = new URL(url, 'https://public.invalid')
  const path = parsed.pathname
  const allowed = path === '/api/categories' || path === '/api/products' || path === '/api/blog' ||
    path === '/api/reviews' || path === '/api/reviews/stats' || /^\/api\/category-insights\/[^/]+$/.test(path) ||
    /^\/api\/products\/[^/]+\/recommendations$/.test(path)
  if (!url.startsWith('/api/') || !allowed || parsed.searchParams.has('all') || url.length > 2048) throw new Error('Only public catalog reads may use the shared cache')
}

export function invalidatePublicJson(url?: string) { if (url) responses.delete(url); else responses.clear() }

export async function readPublicResponse(url: string, init?: { signal?: AbortSignal }, ttl = 60_000): Promise<Response> {
  assertPublicUrl(url)
  const existing = responses.get(url)
  let entry = existing && existing.expiresAt > Date.now() ? existing : undefined
  if (!entry) {
    if (responses.size >= 50) responses.delete(responses.keys().next().value!)
    const pending = { expiresAt: Date.now() + ttl, promise: Promise.resolve(null!) as Promise<SavedResponse> }
    // No cookies: an administrator browsing the storefront must never seed this
    // public cache with a personalized or draft response. Each consumer may
    // cancel its own wait without canceling another component's shared request.
    pending.promise = fetch(url, { credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(20_000) }).then(async response => {
      if (!response.ok) throw new Error('Public content unavailable')
      const body = await response.text()
      JSON.parse(body) // HTML outages must not become cached successful data.
      pending.expiresAt = Date.now() + Math.min(60_000, Math.max(0, ttl))
      return { body, status: response.status, headers: [...response.headers.entries()] }
    }).catch(error => { if (responses.get(url) === pending) responses.delete(url); throw error })
    responses.set(url, pending)
    entry = pending
  }
  const result = await new Promise<SavedResponse>((resolve, reject) => {
    const signal = init?.signal
    const abort = () => reject(signal?.reason || new DOMException('Request aborted', 'AbortError'))
    if (signal?.aborted) { abort(); return }
    signal?.addEventListener('abort', abort, { once: true })
    entry!.promise.then(resolve, reject).finally(() => signal?.removeEventListener('abort', abort))
  })
  return new Response(result.body, { status: result.status, headers: result.headers })
}

export async function readPublicJson<T>(url: string, ttl = 60_000): Promise<T> {
  return (await readPublicResponse(url, undefined, ttl)).json() as Promise<T>
}
