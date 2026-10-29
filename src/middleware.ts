import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit-memory'
import { getRateLimitConfig } from '@/lib/route-rate-limits'

// Edge-safe Next 16 middleware. cloudflare-worker.ts enforces Workers API limits.
// Vercel retains its previous in-memory API protection here.
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (process.env.CLOUDFLARE_WORKER !== 'true' && process.env.NEXTAUTH_URL && /^\/products\/[^/]+\/?$/.test(pathname)) {
    const lookup = new URL('/api/legacy-product-resolution', process.env.NEXTAUTH_URL)
    try { lookup.searchParams.set('slug', decodeURIComponent(pathname.split('/')[2])) } catch { return new NextResponse(null, { status: 400 }) }
    try {
      const result = await fetch(lookup, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(10000) })
      if (result.status === 301 && result.headers.get('location')) return NextResponse.redirect(result.headers.get('location')!, 301)
      if (result.status >= 500) return new NextResponse('Catalog temporarily unavailable', { status: 503 })
    } catch { return new NextResponse('Catalog temporarily unavailable', { status: 503 }) }
  }
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

  // The active Worker entry has already enforced native and durable API limits.
  if (process.env.CLOUDFLARE_WORKER === 'true') return NextResponse.next()

  // --- API rate limiting (Node/Vercel fallback) ------------------------------
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
  matcher: ['/admin/:path*', '/api/:path*', '/products/:path*'],
}
