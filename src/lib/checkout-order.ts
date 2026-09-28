import mongoose from 'mongoose'
import Product from '@/models/Product'
import Discount from '@/models/Discount'
import type { JacketCustomization } from '@/types/jacket-customization'

const JACKET_FONT_STYLES = new Set(['varsity', 'block', 'classic', 'script', 'sans', 'serif'])

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
  customization?: JacketCustomization
}

function sanitizeCustomization(value: unknown, maxTextLength: number): JacketCustomization | undefined {
  if (value == null) return undefined
  if (!value || typeof value !== 'object') throw new CheckoutError('Invalid jacket customization')
  const input = value as Record<string, unknown>
  const output: JacketCustomization = {}

  for (const view of ['front', 'back'] as const) {
    const rawSide = input[view]
    if (rawSide == null) continue
    if (typeof rawSide !== 'object') throw new CheckoutError(`Invalid ${view} jacket customization`)
    const side = rawSide as Record<string, unknown>
    const cleanSide: NonNullable<JacketCustomization[typeof view]> = {}

    if (side.text != null) {
      if (typeof side.text !== 'object') throw new CheckoutError('Invalid embroidered text design')
      const text = side.text as Record<string, unknown>
      const content = typeof text.value === 'string' ? text.value.trim() : ''
      if (content) {
        const color = typeof text.color === 'string' && /^#[0-9a-f]{6}$/i.test(text.color) ? text.color.toLowerCase() : ''
        const fontStyle = typeof text.fontStyle === 'string' && JACKET_FONT_STYLES.has(text.fontStyle) ? text.fontStyle as NonNullable<typeof cleanSide.text>['fontStyle'] : 'varsity'
        const size = Number(text.size)
        const x = Number(text.x)
        const y = Number(text.y)
        if (content.length > maxTextLength || !color || !Number.isFinite(size) || size < 24 || size > 72 || !inUnitRange(x) || !inUnitRange(y)) {
          throw new CheckoutError('Invalid embroidered text design')
        }
        cleanSide.text = { value: content, color, fontStyle, size, x, y }
      }
    }

    if (side.artworks != null) {
      if (!Array.isArray(side.artworks) || side.artworks.length > 12) throw new CheckoutError('Invalid jacket artwork collection')
      const ids = new Set<string>()
      cleanSide.artworks = side.artworks.map((rawArtwork) => {
        if (!rawArtwork || typeof rawArtwork !== 'object') throw new CheckoutError('Invalid jacket artwork')
        const art = rawArtwork as Record<string, unknown>
        const id = typeof art.id === 'string' ? art.id.trim() : ''
        const source = art.source === 'catalog' || art.source === 'upload' ? art.source : null
        const url = typeof art.url === 'string' ? art.url.trim() : undefined
        const catalogId = typeof art.catalogId === 'string' ? art.catalogId.trim() : undefined
        const name = typeof art.name === 'string' ? art.name.trim().slice(0, 80) : 'Artwork'
        const color = typeof art.color === 'string' && /^#[0-9a-f]{6}$/i.test(art.color) ? art.color.toLowerCase() : source === 'catalog' ? '#ffffff' : undefined
        const fontStyle = typeof art.fontStyle === 'string' && JACKET_FONT_STYLES.has(art.fontStyle) ? art.fontStyle as NonNullable<typeof cleanSide.artworks>[number]['fontStyle'] : undefined
        const widthInches = Number(art.widthInches)
        const x = Number(art.x)
        const y = Number(art.y)
        const validSource = source === 'upload'
          ? Boolean(url && /^https:\/\//i.test(url) && url.length <= 1000)
          : Boolean(catalogId && /^[a-z0-9-]{1,40}$/i.test(catalogId))
        if (!/^[a-z0-9-]{1,80}$/i.test(id) || ids.has(id) || !source || !validSource || !name || !Number.isFinite(widthInches) || widthInches < 2 || widthInches > 12 || !inUnitRange(x) || !inUnitRange(y)) {
          throw new CheckoutError('Invalid jacket artwork')
        }
        ids.add(id)
        return { id, source, catalogId, url, name, color, fontStyle, widthInches, x, y }
      })
    }

    if (cleanSide.text || cleanSide.artworks?.length) output[view] = cleanSide
  }

  return output.front || output.back ? output : undefined
}

function inUnitRange(value: number) {
  return Number.isFinite(value) && value >= 0.08 && value <= 0.92
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
  const customization = sanitizeCustomization(input.customization, Number(product.embroidery?.maxChars || 24))
  if (customization && product.embroidery?.available) unitPrice += Number(product.embroidery.fee || 0)
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
    customization,
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
