import { createHmac, randomUUID, timingSafeEqual } from 'crypto'

export const GUEST_ID_COOKIE = 'guest_id'
export const GUEST_ID_MAX_AGE = 60 * 60 * 24 * 365
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function signature(id: string, secret: string) {
  return createHmac('sha256', secret).update(`guest-activity:v1:${id}`).digest('hex')
}

/** Legacy unsigned IDs are rotated: accepting them would preserve impersonation. */
export function resolveGuestIdentity(cookie: string | undefined, secret: string) {
  if (!secret) throw new Error('Guest identity signing secret is not configured')
  const [version, id, mac, extra] = (cookie || '').split('.')
  if (version === 'v1' && uuidPattern.test(id || '') && /^[0-9a-f]{64}$/.test(mac || '') && extra === undefined) {
    const expected = Buffer.from(signature(id, secret), 'hex')
    if (timingSafeEqual(expected, Buffer.from(mac, 'hex'))) return { guestId: id, cookie: cookie!, isNew: false }
  }
  const guestId = randomUUID()
  return { guestId, cookie: `v1.${guestId}.${signature(guestId, secret)}`, isNew: true }
}

export const guestCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: GUEST_ID_MAX_AGE,
  path: '/',
}
