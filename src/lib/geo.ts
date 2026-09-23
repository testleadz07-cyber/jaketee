import { NextRequest } from 'next/server'

export interface RequestGeo {
  country?: string
  region?: string
  city?: string
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
 * Netlify: x-nf-geo carries base64-encoded JSON with a `country` object.
 * Vercel: x-vercel-ip-country carries a plain ISO country code.
 */
export function getGeoFromRequest(request: NextRequest): RequestGeo {
  const netlifyGeo = request.headers.get('x-nf-geo')
  if (netlifyGeo) {
    try {
      const parsed = JSON.parse(Buffer.from(netlifyGeo, 'base64').toString('utf-8'))
      return {
        country: parsed?.country?.name || parsed?.country?.code,
        region: parsed?.subdivision?.name || parsed?.subdivision?.code,
        city: parsed?.city,
      }
    } catch {
      // malformed header - fall through to other sources
    }
  }

  return {
    country: decodeHeader(request.headers.get('x-vercel-ip-country')),
    region: decodeHeader(request.headers.get('x-vercel-ip-country-region')),
    city: decodeHeader(request.headers.get('x-vercel-ip-city')),
  }
}

export function getCountryFromRequest(request: NextRequest): string | undefined {
  return getGeoFromRequest(request).country
}
