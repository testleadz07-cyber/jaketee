import { NextRequest, NextResponse } from 'next/server'
import { getGeoFromRequest } from '@/lib/geo'
import { normalizeShippingCountry, shippingCountryError } from '@/config/fulfillment'

export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  const geo = getGeoFromRequest(request)
  const country = normalizeShippingCountry(geo.country)
  // These are suggestions only. Never use them as the order's delivery address.
  const suggestion = country && !shippingCountryError(country) ? {
    country, state: geo.region || '', city: geo.city || '', zip: geo.postalCode || '',
  } : null
  return NextResponse.json({ suggestion }, { headers: { 'Cache-Control': 'private, no-store' } })
}
