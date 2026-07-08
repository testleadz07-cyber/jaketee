/**
 * In-memory rate limiting utilities.
 *
 * Design notes:
 * - Uses a fixed-window counter per key (IP, email, etc.). Good enough to stop
 *   brute-force / scraping / spam abuse without adding new infrastructure.
 * - State lives in a module-level Map, so it is scoped to a single server
 *   process/isolate. That's fine for this app's single-instance deployment
 *   (Caddy -> one Next.js process). If this is ever deployed across multiple
 *   instances/regions (e.g. serverless with concurrent execution), swap the
 *   Map-based store below for a shared store (Redis/Upstash) behind the same
 *   `RateLimitStore` interface so callers don't need to change.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  /** Unix ms timestamp when the window resets */
  resetAt: number
  /** Seconds the client should wait before retrying (only set when blocked) */
  retryAfterSec?: number
}

const store = new Map<string, RateLimitEntry>()

// Opportunistically prune expired entries so the map doesn't grow forever.
// Cheap probabilistic sweep instead of a timer (timers don't play well with
// edge runtimes / serverless isolates).
function pruneExpired(now: number) {
  if (store.size < 500 || Math.random() > 0.02) return
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key)
  }
}

/**
 * Fixed-window rate limiter.
 *
 * @param key unique identifier for the thing being limited, e.g. `login:1.2.3.4`
 * @param limit max requests allowed within the window
 * @param windowMs window size in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  pruneExpired(now)

  const existing = store.get(key)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { success: true, limit, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count += 1
  return { success: true, limit, remaining: limit - existing.count, resetAt: existing.resetAt }
}

/**
 * Resolve the best-effort client IP from a request, accounting for the
 * reverse proxy (Caddy) sitting in front of the app in production.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list; the first entry is the
    // original client.
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  }
  if (result.retryAfterSec) {
    headers['Retry-After'] = String(result.retryAfterSec)
  }
  return headers
}

// ---------------------------------------------------------------------------
// Per-account login attempt guard (credential stuffing / brute force).
//
// The middleware-level IP rate limit stops a single IP from hammering the
// login endpoint, but attackers routinely rotate IPs while targeting one
// account. This adds a second, email-keyed lock so a specific account can't
// be brute-forced even from many IPs.
// ---------------------------------------------------------------------------

const LOGIN_MAX_ATTEMPTS = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function loginKey(identifier: string) {
  return `login-attempts:${identifier.toLowerCase().trim()}`
}

export function isLoginLocked(identifier: string): { locked: boolean; retryAfterSec?: number } {
  const entry = store.get(loginKey(identifier))
  const now = Date.now()
  if (!entry || entry.resetAt <= now) return { locked: false }
  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    return { locked: true, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) }
  }
  return { locked: false }
}

export function recordFailedLogin(identifier: string): void {
  const now = Date.now()
  const key = loginKey(identifier)
  const existing = store.get(key)
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    return
  }
  existing.count += 1
}

export function resetLoginAttempts(identifier: string): void {
  store.delete(loginKey(identifier))
}
