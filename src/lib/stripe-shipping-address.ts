import type Stripe from 'stripe'
import { normalizeShippingCountry, shippingCountryError } from '@/config/fulfillment'

// Stripe can collect a different address from the storefront form. Fulfill the
// address confirmed at payment, rather than the earlier unconfirmed address.
export function applyStripeShippingAddress(order: { shippingAddress: any }, session: Stripe.Checkout.Session) {
  const details = session.collected_information?.shipping_details ||
    (session as unknown as { shipping_details?: { name: string; address: Stripe.Address } }).shipping_details
  if (!details?.address) return // Sessions created before address collection was enabled.
  const address = details.address
  const error = shippingCountryError(address.country)
  if (error) throw new Error(error)
  order.shippingAddress = {
    name: details.name || order.shippingAddress.name,
    street: [address.line1, address.line2].filter(Boolean).join(', '),
    city: address.city || '', state: address.state || '', zip: address.postal_code || '',
    country: normalizeShippingCountry(address.country), phone: order.shippingAddress.phone,
  }
}
