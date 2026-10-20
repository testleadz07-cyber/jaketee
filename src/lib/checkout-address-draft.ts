export interface CheckoutAddressDraft {
  name: string; email: string; phone: string; street: string; city: string; state: string; zip: string; country: string
}
export interface AddressConfirmation { token: string; expiresAt: number }
export const EMPTY_CHECKOUT_ADDRESS: CheckoutAddressDraft = {
  name: '', email: '', phone: '', street: '', city: '', state: '', zip: '', country: '',
}
export function checkoutAddressKey(owner: string) { return `jacketee-checkout-address:${owner}` }

export function readCheckoutAddressDraft(raw: string | null, now = Date.now()) {
  try {
    const value = JSON.parse(raw || 'null')
    if (!value || !Number.isFinite(value.updatedAt) || value.updatedAt > now || now - value.updatedAt > 24 * 60 * 60 * 1000) return null
    const address = { ...EMPTY_CHECKOUT_ADDRESS }
    for (const key of Object.keys(address) as Array<keyof CheckoutAddressDraft>) {
      if (typeof value.address?.[key] !== 'string' || value.address[key].length > 500) return null
      address[key] = value.address[key]
    }
    const confirmation: AddressConfirmation | null = typeof value.confirmation?.token === 'string' &&
      value.confirmation.token.length <= 250 && Number.isFinite(value.confirmation.expiresAt) && value.confirmation.expiresAt > now
      ? value.confirmation : null
    return { address, confirmation, suggested: value.suggested === true }
  } catch { return null }
}

export function suggestCheckoutLocation(address: CheckoutAddressDraft, suggestion: unknown): CheckoutAddressDraft {
  // Avoid mixing an existing or partially typed destination with the current IP location.
  if (address.street || address.country || address.city || address.state || address.zip ||
    !suggestion || typeof suggestion !== 'object') return address
  const value = suggestion as Record<string, unknown>
  if (typeof value.country !== 'string' || !/^[A-Z]{2}$/.test(value.country)) return address
  const safe = (key: string) => typeof value[key] === 'string' && value[key].length <= 200 && !/[\x00-\x1f]/.test(value[key]) ? value[key] : ''
  return { ...address, country: value.country, state: safe('state'), city: safe('city'), zip: safe('zip') }
}
