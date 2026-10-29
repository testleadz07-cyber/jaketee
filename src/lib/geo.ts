import { getCloudflareContext } from '@opennextjs/cloudflare'

export interface RequestGeo {
  country?: string
  region?: string
  city?: string
  postalCode?: string
}

/**
 * Resolves the visitor's country from platform-injected request headers -
 * no outbound network call needed (unlike a third-party IP-geolocation API).
 * OpenNext preserves trusted request.cf metadata in the invocation context.
 * No Vercel fallback or caller-supplied city/region headers are used.
 * These hints must never be used as an authorization or fraud boundary.
 */
export function getGeoFromRequest(request: Pick<Request, 'headers'>): RequestGeo {
  let cf: Record<string, unknown> | undefined
  try { cf = getCloudflareContext<Record<string, unknown>>().cf } catch { /* Local development has no visitor metadata. */ }
  return {
    country: countryCode(cf?.country) || countryCode(request.headers.get('cf-ipcountry')),
    region: boundedGeo(cf?.regionCode) || boundedGeo(cf?.region),
    city: boundedGeo(cf?.city),
    postalCode: boundedGeo(cf?.postalCode),
  }
}

function countryCode(value: unknown): string | undefined {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : undefined
  return code && /^[A-Z]{2}$/.test(code) && code !== 'XX' ? code : undefined
}

function boundedGeo(value: unknown): string | undefined {
  return typeof value === 'string' && value.length <= 200 && !/[\x00-\x1f]/.test(value) ? value : undefined
}

export function getCountryFromRequest(request: Pick<Request, 'headers'>): string | undefined {
  return getGeoFromRequest(request).country
}
