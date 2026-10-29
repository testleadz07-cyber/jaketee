import { NextRequest, NextResponse } from 'next/server'
import { getCountryFromRequest } from '@/lib/geo'

export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  const country = getCountryFromRequest(request)
  return NextResponse.json({ country: country && /^[A-Z]{2}$/.test(country) ? country : null }, {
    headers: { 'Cache-Control': 'private, no-store', Vary: 'cf-ipcountry' },
  })
}
