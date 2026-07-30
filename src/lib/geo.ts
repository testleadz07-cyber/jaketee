import { NextRequest } from 'next/server'

/**
 * Resolves the visitor's country from platform-injected request headers -
 * no outbound network call needed (unlike a third-party IP-geolocation API).
 * Netlify: x-nf-geo carries base64-encoded JSON with a `country` object.
 * Vercel: x-vercel-ip-country carries a plain ISO country code.
 */
export function getCountryFromRequest(request: NextRequest): string | undefined {
  const netlifyGeo = request.headers.get('x-nf-geo')
  if (netlifyGeo) {
    try {
      const parsed = JSON.parse(Buffer.from(netlifyGeo, 'base64').toString('utf-8'))
      const country = parsed?.country?.name || parsed?.country?.code
      if (country) return country
    } catch {
      // malformed header - fall through to other sources
    }
  }

  const vercelCountry = request.headers.get('x-vercel-ip-country')
  if (vercelCountry) return vercelCountry

  return undefined
}
