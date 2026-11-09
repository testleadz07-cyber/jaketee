import type { InvoiceOrderData } from './invoice-pdf'

export const invoicePaymentMethods = ['paypal', 'stripe', 'cash', 'bank_transfer', 'other'] as const
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

/** Explicit projection: never store order, payment-provider, or account fields in an invoice. */
export function invoiceFromOrder(order: InvoiceOrderData): InvoiceOrderData {
  return {
    orderNumber: order.orderNumber, createdAt: new Date(order.createdAt).toISOString(),
    userName: order.userName, userEmail: order.userEmail,
    items: order.items.map(item => ({ name: item.name, price: item.price, quantity: item.quantity,
      variants: (item.variants || []).map(v => ({ name: v.name, value: v.value })) })),
    subtotal: order.subtotal, shipping: order.shipping, tax: order.tax,
    discountAmount: order.discountAmount || 0, promoCode: order.promoCode || '',
    total: order.total, paymentMethod: order.paymentMethod || 'other',
    shippingAddress: { name: order.shippingAddress.name, street: order.shippingAddress.street,
      city: order.shippingAddress.city, state: order.shippingAddress.state || '',
      zip: order.shippingAddress.zip, country: order.shippingAddress.country,
      phone: order.shippingAddress.phone || '' },
  }
}

export function validateInvoiceEdit(input: unknown, original: InvoiceOrderData): InvoiceOrderData {
  if (!input || typeof input !== 'object') throw new Error('Invoice details are required.')
  const data = input as Record<string, unknown>
  const text = (value: unknown, label: string, max = 160, required = true): string => {
    if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim()) || /[\x00-\x1f\x7f]/.test(value)) {
      throw new Error(`Invalid ${label}.`)
    }
    return value.trim()
  }
  const amount = (value: unknown, label: string): number => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1_000_000 || Math.abs(value - round(value)) > 0.000001) {
      throw new Error(`${label} must be between 0 and 1,000,000 with at most two decimal places.`)
    }
    return round(value)
  }
  const userName = text(data.userName, 'billing name')
  const userEmail = text(data.userEmail, 'billing email', 254)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) throw new Error('Invalid billing email.')
  if (!invoicePaymentMethods.includes(data.paymentMethod as typeof invoicePaymentMethods[number])) throw new Error('Invalid payment method.')
  const address = data.shippingAddress as Record<string, unknown> | undefined
  if (!address || typeof address !== 'object') throw new Error('Address is required.')
  const shippingAddress = {
    name: text(address.name, 'recipient name'), street: text(address.street, 'street', 240),
    city: text(address.city, 'city'), state: text(address.state, 'state', 100, false),
    zip: text(address.zip, 'postal code', 40), country: text(address.country, 'country', 100),
    phone: text(address.phone ?? '', 'phone', 60, false),
  }
  if (!Array.isArray(data.items) || !data.items.length || data.items.length > 100) throw new Error('Include between 1 and 100 invoice items.')
  const items = data.items.map((item: Record<string, unknown>) => {
    if (!item || typeof item !== 'object') throw new Error('Invalid invoice item.')
    if (!Number.isSafeInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 10000) throw new Error('Quantity must be a whole number between 1 and 10,000.')
    if (!Array.isArray(item.variants) || item.variants.length > 12) throw new Error('Invalid item options.')
    if (JSON.stringify(item.variants).length > 900) throw new Error('Item options are too long. Please shorten them to fit the invoice.')
    return { name: text(item.name, 'product name', 300), price: amount(item.price, 'Unit price'), quantity: Number(item.quantity),
      variants: item.variants.map((v: Record<string, unknown>) => {
        if (!v || typeof v !== 'object') throw new Error('Invalid item option.')
        return { name: text(v.name, 'option name', 60), value: text(v.value, 'option value', 100) }
      }) }
  })
  const subtotal = round(items.reduce((sum, item) => sum + round(item.price * item.quantity), 0))
  const shipping = amount(data.shipping, 'Shipping'), tax = amount(data.tax, 'Tax')
  const discountAmount = amount(data.discountAmount, 'Discount')
  if (discountAmount > subtotal + shipping + tax) throw new Error('Discount cannot exceed the invoice amount.')
  const total = round(subtotal + shipping + tax - discountAmount)
  if (total > 1_000_000) throw new Error('Invoice total cannot exceed 1,000,000.')
  return { orderNumber: original.orderNumber, createdAt: original.createdAt, userName, userEmail, shippingAddress,
    items, subtotal, shipping, tax, discountAmount, promoCode: text(data.promoCode ?? '', 'promo code', 40, false),
    total, paymentMethod: data.paymentMethod as string }
}
