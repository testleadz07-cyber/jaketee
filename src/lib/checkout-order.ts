import mongoose from 'mongoose'
import Product from '@/models/Product'
import Discount from '@/models/Discount'

export class CheckoutError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

export function resolveCheckoutCustomer(
  user: { id?: string; email?: string | null; name?: string | null } | undefined,
  guestEmail: unknown,
  shippingAddress: unknown
) {
  const address = shippingAddress as Record<string, unknown> | null
  if (!address || typeof address !== 'object') throw new CheckoutError('Shipping address is required')
  for (const field of ['name', 'street', 'city', 'state', 'zip', 'country']) {
    if (typeof address[field] !== 'string' || !String(address[field]).trim()) {
      throw new CheckoutError(`Shipping ${field} is required`)
    }
  }

  const email = (user?.email || guestEmail)
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new CheckoutError('A valid email address is required')
  }
  return {
    userId: user?.id || undefined,
    userEmail: email.trim().toLowerCase(),
    userName: user?.name || String(address.name).trim(),
  }
}

interface CheckoutItemInput {
  productId: string
  price: number
  quantity: number
  variants?: Array<{ name: string; value: string }>
}

export async function resolveCheckoutItems(rawItems: unknown) {
  if (!Array.isArray(rawItems) || rawItems.length !== 1) {
    throw new CheckoutError('Checkout supports one jacket per order. Contact us for a bulk quote.')
  }
  const input = rawItems[0] as CheckoutItemInput
  if (!mongoose.isValidObjectId(input?.productId) || input.quantity !== 1) {
    throw new CheckoutError('Invalid checkout item')
  }
  const product = await Product.findById(input.productId).lean()
  if (!product || !product.inStock || Number(product.stockCount) < 1) {
    throw new CheckoutError('This jacket is no longer available', 409)
  }

  const variants = input.variants ?? []
  if (!Array.isArray(variants)) throw new CheckoutError('Invalid jacket options')
  const seen = new Set<string>()
  let unitPrice = Number(product.price)
  for (const variant of variants) {
    if (!variant || typeof variant.name !== 'string' || typeof variant.value !== 'string') {
      throw new CheckoutError('Invalid jacket option')
    }
    const name = variant.name.trim()
    const value = variant.value.trim()
    if (!name || !value || seen.has(name)) throw new CheckoutError('Invalid or duplicate jacket option')
    seen.add(name)
    if (name === 'Standard' && value === 'Default' && variants.length === 1) continue
    if (name === 'Monogram') {
      if (!product.embroidery?.available || value.length > product.embroidery.maxChars) {
        throw new CheckoutError('Monogram is unavailable for this jacket')
      }
      unitPrice += Number(product.embroidery.fee || 0)
      continue
    }
    if (name.startsWith('Measurement: ')) {
      const field = name.slice('Measurement: '.length)
      if (!product.measurementFields?.includes(field) || !/^\d+(?:\.\d+)?in$/.test(value)) {
        throw new CheckoutError('Invalid jacket measurement')
      }
      continue
    }
    const option = product.variants?.find((item) => item.name === name && item.value === value && item.inStock)
    if (!option) throw new CheckoutError('A selected jacket option is unavailable')
    unitPrice += Number(option.priceAdjust || 0)
  }
  unitPrice = Number(unitPrice.toFixed(2))
  if (!Number.isFinite(unitPrice) || unitPrice < 0 || Math.abs(Number(input.price) - unitPrice) > 0.01) {
    throw new CheckoutError('Jacket price has changed. Refresh your cart before checking out.', 409)
  }

  return [{
    productId: String(product._id),
    name: product.name,
    image: product.images?.[0]?.url || '/placeholder.png',
    price: unitPrice,
    quantity: 1,
    variants: variants.map((variant) => ({ name: variant.name.trim(), value: variant.value.trim() })),
  }]
}

export async function resolveCheckoutDiscount(rawCode: unknown, subtotal: number) {
  const code = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : ''
  if (!code) return { code: undefined, amount: 0, freeShipping: false, type: undefined, value: 0 }
  const discount = await Discount.findOne({ code, isActive: true }).lean()
  const now = new Date()
  if (!discount || (discount.startDate && now < discount.startDate) ||
    (discount.endDate && now > discount.endDate) ||
    (discount.usageLimit != null && discount.usageCount >= discount.usageLimit) ||
    subtotal < discount.minOrderValue) {
    throw new CheckoutError('Promo code is no longer valid. Remove it and try again.', 409)
  }
  const amount = discount.discountType === 'percentage'
    ? Math.min(subtotal, Math.max(0, subtotal * Number(discount.discountValue) / 100))
    : discount.discountType === 'fixed'
      ? Math.min(subtotal, Math.max(0, Number(discount.discountValue)))
      : 0
  return {
    code,
    amount: Number(amount.toFixed(2)),
    freeShipping: discount.discountType === 'free_shipping',
    type: discount.discountType,
    value: Number(discount.discountValue),
  }
}
