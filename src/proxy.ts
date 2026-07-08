import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit'

// Route-specific rate limit budgets. Keys are exact pathnames.
// Anything under /api not listed here falls back to DEFAULT_API_LIMIT,
// except the exempted NextAuth polling endpoints below.
const ROUTE_LIMITS: Record<string, { windowMs: number; max: number }> = {
  // Login (NextAuth credentials callback) - brute force protection
  '/api/auth/callback/credentials': { windowMs: 15 * 60 * 1000, max: 8 },
  // Registration - prevent mass account creation
  '/api/auth/register': { windowMs: 60 * 60 * 1000, max: 5 },
  // Promo / coupon code guessing
  '/api/discounts/validate': { windowMs: 60 * 1000, max: 10 },
  '/api/discounts/check': { windowMs: 60 * 1000, max: 10 },
  // Contact form spam
  '/api/contact': { windowMs: 60 * 60 * 1000, max: 5 },
  // Newsletter signup spam
  '/api/newsletter/subscribe': { windowMs: 60 * 60 * 1000, max: 5 },
  // Checkout / payment abuse
  '/api/orders': { windowMs: 60 * 1000, max: 10 },
  '/api/payments/create-order': { windowMs: 60 * 1000, max: 10 },
  '/api/payments/capture': { windowMs: 60 * 1000, max: 10 },
  '/api/payments/stripe/checkout': { windowMs: 60 * 1000, max: 10 },
  '/api/payments/stripe/verify': { windowMs: 60 * 1000, max: 15 },
  // Reviews / uploads - spam and storage abuse
  '/api/reviews': { windowMs: 60 * 1000, max: 8 },
  '/api/upload': { windowMs: 60 * 1000, max: 10 },
}

// NextAuth polls these frequently on every page load; don't throttle them.
const RATE_LIMIT_EXEMPT = new Set([
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/signout',
  '/api/auth/signin',
])

// Generic ceiling for any other /api route not explicitly listed above.
const DEFAULT_API_LIMIT = { windowMs: 60 * 1000, max: 60 }

function getRateLimitConfig(pathname: string) {
  if (RATE_LIMIT_EXEMPT.has(pathname)) return null
  if (ROUTE_LIMITS[pathname]) return ROUTE_LIMITS[pathname]
  if (pathname.startsWith('/api/')) return DEFAULT_API_LIMIT
  return null
}

// Next.js 16 renamed the `middleware.ts` convention to `proxy.ts` - this file
// is the actual entry point that runs on every matched request. It combines:
//   1. Admin route auth gating (previously in this file, via next-auth's
//      withAuth - rewritten inline below so it can share a single file with
//      the rate limiter, since only one proxy/middleware file is allowed).
//   2. API rate limiting to block brute force / coupon-guessing / spam abuse.
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- Admin route protection -------------------------------------------
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token || (token as any).role !== 'admin') {
      const signInUrl = new URL('/login', request.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }
    return NextResponse.next()
  }

  // --- API rate limiting ---------------------------------------------------
  const rateLimitConfig = getRateLimitConfig(pathname)
  if (rateLimitConfig) {
    const ip = getClientIp(request)
    const key = `${pathname}:${ip}`
    const result = checkRateLimit(key, rateLimitConfig.max, rateLimitConfig.windowMs)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(result) }
      )
    }

    const response = NextResponse.next()
    const headers = rateLimitHeaders(result)
    for (const [name, value] of Object.entries(headers)) {
      response.headers.set(name, value)
    }
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
