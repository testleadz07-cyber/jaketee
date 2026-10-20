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
 * Netlify: x-nf-geo carries base64-encoded JSON with a `country` object.
 * Vercel: x-vercel-ip-country carries a plain ISO country code.
 */
export function getGeoFromRequest(request: NextRequest): RequestGeo {
  // Only trust headers when deployment explicitly selects an overwriting edge.
  const provider = process.env.ACTIVITY_GEO_PROVIDER ||
    (process.env.VERCEL === '1' ? 'vercel' : process.env.NETLIFY === 'true' ? 'netlify' : '')
  const netlifyGeo = provider === 'netlify' ? request.headers.get('x-nf-geo') : null
  if (netlifyGeo) {
    try {
      const parsed = JSON.parse(Buffer.from(netlifyGeo, 'base64').toString('utf-8'))
      return {
        country: boundedGeo(parsed?.country?.code || parsed?.country?.name),
        region: boundedGeo(parsed?.subdivision?.name || parsed?.subdivision?.code),
        city: boundedGeo(parsed?.city),
      }
    } catch {
      // malformed header - fall through to other sources
    }
  }

  if (provider !== 'vercel') return {}
  return {
    country: boundedGeo(decodeHeader(request.headers.get('x-vercel-ip-country'))),
    region: boundedGeo(decodeHeader(request.headers.get('x-vercel-ip-country-region'))),
    city: boundedGeo(decodeHeader(request.headers.get('x-vercel-ip-city'))),
    postalCode: boundedGeo(decodeHeader(request.headers.get('x-vercel-ip-postal-code'))),
  }
}

function boundedGeo(value: unknown): string | undefined {
  return typeof value === 'string' && value.length <= 200 && !/[\x00-\x1f]/.test(value) ? value : undefined
}

export function getCountryFromRequest(request: NextRequest): string | undefined {
  return getGeoFromRequest(request).country
}
