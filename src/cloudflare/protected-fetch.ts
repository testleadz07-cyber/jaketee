import { securityOperation, type SecurityEnv } from '../lib/cloudflare-security'
import { getRateLimitConfig } from '../lib/route-rate-limits'
import { getClientIp, rateLimitHeaders } from '../lib/rate-limit-memory'

type WorkerFetch = (request: Request, env: SecurityEnv & Record<string, unknown>, ctx: ExecutionContext) => Promise<Response>

/** Protect public API entry points before delegating to OpenNext unchanged. */
export function protectedWorkerFetch(fetch: WorkerFetch): WorkerFetch {
  return async (request, env, ctx) => {
    const path = new URL(request.url).pathname
    // Provider callbacks authenticate their own messages. Browser request quotas
    // must not interfere with provider retries or manually invoked cron routes.
    const rule = request.method === 'OPTIONS' || path.startsWith('/api/webhooks/') || path.startsWith('/api/cron/')
      ? null : getRateLimitConfig(path)
    let headers: Record<string, string> | undefined
    if (rule) {
      try {
        // Preserve the existing anonymous per-route/IP abuse budgets. These are
        // not per-account quotas: users behind a shared address share a budget.
        const key = `${path}:${getClientIp(request)}`
        const limiter = path === '/api/auth/callback/credentials' ? env.LOGIN_LIMITER : env.API_LIMITER
        if (!limiter) throw new Error('Native rate limiter binding is missing')
        if (!(await limiter.limit({ key })).success) {
          return Response.json({ error: 'Too many requests. Please try again later.' }, {
            status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'private, no-store' },
          })
        }
        const result = await securityOperation(env, key, 'limit', rule.max, rule.windowMs)
        headers = { ...rateLimitHeaders(result), 'Cache-Control': 'private, no-store' }
        if (!result.success) return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers })
      } catch {
        return Response.json({ error: 'Request protection temporarily unavailable' }, {
          status: 503, headers: { 'Cache-Control': 'private, no-store' },
        })
      }
    }

    const cacheMetrics = { hits: 0, misses: 0, bypasses: 0 }
    const response = await fetch(request, { ...env, CLOUDFLARE_WORKER: 'true', __PUBLIC_CACHE_METRICS: cacheMetrics }, ctx)
    const legacyRedirect = /^\/products\/[^/]+\/?$/.test(path) && response.status === 308 && response.headers.has('location')
    const staging = new URL(request.url).hostname.endsWith('.workers.dev')
    if (!headers && !legacyRedirect && !staging) return response
    const responseHeaders = new Headers(response.headers)
    for (const [name, value] of Object.entries(headers || {})) responseHeaders.set(name, value)
    if (staging) responseHeaders.set('X-Robots-Tag', 'noindex, nofollow')
    const publicApi = /^\/api\/(categories|products|reviews|reviews\/stats|reviews\/highlights|faqs|blog)$/.test(path) ||
      /^\/api\/(category-insights\/[^/]+|products\/[^/]+\/recommendations)$/.test(path)
    if (request.method === 'GET' && publicApi && !new URL(request.url).searchParams.has('all') && response.ok) {
      if (cacheMetrics.bypasses) responseHeaders.set('X-Public-Data-Cache', 'BYPASS')
      else if (cacheMetrics.misses) responseHeaders.set('X-Public-Data-Cache', 'MISS')
      else if (cacheMetrics.hits) responseHeaders.set('X-Public-Data-Cache', 'HIT')
    }
    return new Response(response.body, { status: legacyRedirect ? 301 : response.status, statusText: legacyRedirect ? 'Moved Permanently' : response.statusText, headers: responseHeaders })
  }
}
