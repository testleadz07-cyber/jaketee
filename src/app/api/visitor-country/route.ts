import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  const country = request.headers.get('x-vercel-ip-country')?.toUpperCase()
  return NextResponse.json({ country: country && /^[A-Z]{2}$/.test(country) ? country : null }, {
    headers: { 'Cache-Control': 'private, no-store', Vary: 'x-vercel-ip-country' },
  })
}
