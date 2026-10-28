import { NextRequest } from 'next/server'

export interface RequestGeo {
  country?: string
  region?: string
  city?: string
  postalCode?: string
}

function decodeHeader(value: string | null): string | undefined {
  if (!value) return undefined
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch {
    return value
  }
}

/**
 * Resolves the visitor's country from platform-injected request headers -
 * no outbound network call needed (unlike a third-party IP-geolocation API).
 * Cloudflare overwrites cf-ipcountry at its edge. Vercel is the fallback.
 * These hints must never be used as an authorization or fraud boundary.
 */
export function getGeoFromRequest(request: NextRequest): RequestGeo {
  const cfCountry = countryCode(request.headers.get('cf-ipcountry'))
  if (cfCountry) return { country: cfCountry }
  return {
    country: countryCode(request.headers.get('x-vercel-ip-country')),
    region: boundedGeo(decodeHeader(request.headers.get('x-vercel-ip-country-region'))),
    city: boundedGeo(decodeHeader(request.headers.get('x-vercel-ip-city'))),
    postalCode: boundedGeo(decodeHeader(request.headers.get('x-vercel-ip-postal-code'))),
  }
}

function countryCode(value: string | null): string | undefined {
  const code = value?.trim().toUpperCase()
  return code && /^[A-Z]{2}$/.test(code) && code !== 'XX' ? code : undefined
}

function boundedGeo(value: unknown): string | undefined {
  return typeof value === 'string' && value.length <= 200 && !/[\x00-\x1f]/.test(value) ? value : undefined
}

export function getCountryFromRequest(request: NextRequest): string | undefined {
  return getGeoFromRequest(request).country
}
