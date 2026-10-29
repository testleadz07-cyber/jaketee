import { NextRequest, NextResponse } from 'next/server'
import { resolveSlugPath } from '@/lib/route-resolver'

export const dynamic = 'force-dynamic'

// Public canonical URL lookup. Resolve before starting an HTML stream so Next's
// loading boundary cannot turn a permanent redirect into HTTP 200 + a meta tag.
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug || slug.length > 2048 || slug.includes('/')) return new NextResponse(null, { status: 404 })
  let resolution
  try { resolution = await resolveSlugPath(['products', slug]) }
  catch { return new NextResponse(null, { status: 503 }) }
  const headers = { 'Cache-Control': 'no-store' }
  if (resolution.type === 'redirect') return new NextResponse(null, {
    status: 301, headers: { ...headers, Location: new URL(resolution.to, request.nextUrl.origin).href },
  })
  return new NextResponse(null, { status: resolution.type === 'product' ? 204 : 404, headers })
}
