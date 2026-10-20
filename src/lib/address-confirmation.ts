import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { CheckoutError } from '@/lib/checkout-order'

export const ADDRESS_CONFIRMATION_MAX_AGE_MS = 2 * 60 * 60 * 1000
export type ConfirmedAddress = {
  name: string; street: string; city: string; state: string; zip: string; country: string; phone?: string
}

// Use a fixed field order, excluding unknown client properties.
function fingerprint(address: ConfirmedAddress, email: string, userId?: string) {
  return createHash('sha256').update(JSON.stringify([
    userId || '', email.trim().toLowerCase(), address.name.trim(), address.street.trim(),
    address.city.trim(), address.state.trim(), address.zip.trim(), address.country,
    address.phone?.trim() || '',
  ])).digest('hex')
}

function sign(value: string) {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new CheckoutError('Address confirmation is not configured', 503)
  return createHmac('sha256', secret).update(`checkout-address:${value}`).digest('hex')
}

export function issueAddressConfirmation(address: ConfirmedAddress, email: string, userId?: string, now = Date.now()) {
  const value = `v1.${now}.${fingerprint(address, email, userId)}`
  return { token: `${value}.${sign(value)}`, expiresAt: now + ADDRESS_CONFIRMATION_MAX_AGE_MS }
}

export function verifyAddressConfirmation(token: unknown, address: ConfirmedAddress, email: string, userId?: string, now = Date.now()): Date {
  const fail = () => { throw new CheckoutError('Please review and confirm your delivery address again.', 409) }
  if (typeof token !== 'string' || token.length > 250) return fail()
  const [version, timestamp, hash, signature, extra] = token.split('.')
  const issuedAt = Number(timestamp)
  if (version !== 'v1' || extra !== undefined || !Number.isSafeInteger(issuedAt) || issuedAt > now ||
    now - issuedAt >= ADDRESS_CONFIRMATION_MAX_AGE_MS || !/^[a-f0-9]{64}$/.test(hash || '') ||
    !/^[a-f0-9]{64}$/.test(signature || '')) return fail()
  const expected = sign(`${version}.${timestamp}.${hash}`)
  if (!timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex')) ||
    hash !== fingerprint(address, email, userId)) return fail()
  return new Date(issuedAt)
}
