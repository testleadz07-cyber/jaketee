import mongoose from 'mongoose'
import { getProductVariants } from '@/lib/product-variants'
import { normalizeShippingCountry, shippingCountryError } from '@/config/fulfillment'
import { GARMENT_CATEGORIES, GARMENT_TEMPLATES, getGarmentCategory, validateGarmentOptions, getGarmentPrice, getGarmentSvg, type GarmentCategory } from '@/lib/garment-template'
import Product from '@/models/Product'
import Discount from '@/models/Discount'
import User from '@/models/User'
import { JACKET_VIEWS, MAX_JACKET_TEXTS, JACKET_TEXT_LAYOUTS, type JacketTextLayout, type JacketCustomization } from '@/types/jacket-customization'
import { getCustomizationFee } from '@/lib/customization-pricing'
import { VARSITY_TEMPLATE_ID, validateVarsityOptions, getVarsityPrice, getVarsitySvg } from '@/lib/varsity-template'

const JACKET_FONT_STYLES = new Set(['varsity', 'block', 'classic', 'script', 'sans', 'serif'])

export class CheckoutError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

export async function resolveCheckoutCustomer(
  user: { id?: string; email?: string | null; name?: string | null } | undefined,
  guestEmail: unknown,
  shippingAddress: unknown
) {
  if (!shippingAddress || typeof shippingAddress !== 'object' || Array.isArray(shippingAddress)) {
    throw new CheckoutError('Shipping address is required')
  }
  const address = shippingAddress as Record<string, unknown>
  const limits: Record<string, number> = { name: 200, street: 500, city: 200, state: 200, zip: 32, country: 200 }
  for (const [field, limit] of Object.entries(limits)) {
    const value = address[field]
    if (typeof value !== 'string' || !value.trim() || value.trim().length > limit || /[\x00-\x1f]/.test(value)) {
      throw new CheckoutError(`Valid shipping ${field} is required`)
    }
    address[field] = value.trim()
  }
  if (address.phone != null) {
    if (typeof address.phone !== 'string' || address.phone.length > 50 || /[\x00-\x1f]/.test(address.phone)) {
      throw new CheckoutError('Invalid shipping phone number')
    }
    address.phone = address.phone.trim()
  }

  // Session identity is server-issued; refresh account status and contact data from the database.
  let customer: { email?: string | null; name?: string | null; isActive?: boolean } | null | undefined = user
  if (user) {
    if (!mongoose.isValidObjectId(user.id)) throw new CheckoutError('Invalid customer account', 401)
    customer = await User.findById(user.id).select('_id name email isActive').lean()
    if (!customer || !customer.isActive) throw new CheckoutError('Customer account is unavailable', 403)
  }
  const email = (customer?.email || guestEmail)
  const countryError = shippingCountryError(address.country)
  if (countryError) throw new CheckoutError(countryError)
  address.country = normalizeShippingCountry(address.country)!
  if (typeof email !== 'string' || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new CheckoutError('A valid email address is required')
  }
  return {
    userId: user?.id || undefined,
    userEmail: email.trim().toLowerCase(),
    userName: customer?.name || String(address.name).trim(),
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
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new CheckoutError('Invalid jacket customization')
  const input = value as Record<string, unknown>
  const output: JacketCustomization = {}
  if (input.varsityOptions != null) {
    try { output.varsityOptions = validateVarsityOptions(input.varsityOptions) }
    catch { throw new CheckoutError('Invalid varsity jacket options') }
  }

  if (input.garmentOptions != null || input.garmentCategory != null) {
    if (!GARMENT_CATEGORIES.includes(input.garmentCategory as GarmentCategory) || input.varsityOptions != null) throw new CheckoutError('Invalid jacket category')
    output.garmentCategory = input.garmentCategory as GarmentCategory
    try { output.garmentOptions = validateGarmentOptions(output.garmentCategory, input.garmentOptions) }
    catch { throw new CheckoutError('Invalid jacket options') }
  }
  for (const view of JACKET_VIEWS) {
    const rawSide = input[view]
    if (rawSide == null) continue
    if (typeof rawSide !== 'object') throw new CheckoutError(`Invalid ${view} jacket customization`)
    const side = rawSide as Record<string, unknown>
    const cleanSide: NonNullable<JacketCustomization[typeof view]> = {}

    if (side.texts != null && (!Array.isArray(side.texts) || side.texts.length > MAX_JACKET_TEXTS)) throw new CheckoutError('Invalid text collection')
    if (side.text != null && (typeof side.text !== 'object' || Array.isArray(side.text))) throw new CheckoutError('Invalid embroidered text design')
    const legacyText = side.text as Record<string, unknown> | undefined
    if (legacyText?.value != null && typeof legacyText.value !== 'string') throw new CheckoutError('Invalid text content')
    const hasLegacyText = typeof legacyText?.value === 'string' && legacyText.value.trim()
    if (side.texts != null && hasLegacyText) throw new CheckoutError('Use one text format')
    const rawTexts = (side.texts as unknown[] | undefined) ?? (hasLegacyText ? [legacyText] : [])
    const textIds = new Set<string>()
    cleanSide.texts = []
    for (const rawText of rawTexts) {
      if (!rawText || typeof rawText !== 'object' || Array.isArray(rawText)) throw new CheckoutError('Invalid embroidered text design')
      const text = rawText as Record<string, unknown>
      const id = side.texts == null ? 'legacy-text' : typeof text.id === 'string' ? text.id.trim() : ''
      if (!id || id.length > 100 || textIds.has(id)) throw new CheckoutError('Invalid text ID')
      textIds.add(id)
      if (typeof text.value !== 'string') throw new CheckoutError('Invalid text content')
      const content = text.value.trim()
      if (content) {
        const color = typeof text.color === 'string' && /^#[0-9a-f]{6}$/i.test(text.color) ? text.color.toLowerCase() : ''
        const fontStyle = typeof text.fontStyle === 'string' && JACKET_FONT_STYLES.has(text.fontStyle) ? text.fontStyle as NonNullable<typeof cleanSide.text>['fontStyle'] : 'varsity'
        if (text.layout != null && !JACKET_TEXT_LAYOUTS.includes(text.layout as JacketTextLayout)) throw new CheckoutError('Invalid text layout')
        const layout = (text.layout || 'straight') as JacketTextLayout
        const size = Number(text.size)
        const x = Number(text.x)
        const y = Number(text.y)
        if (content.length > maxTextLength || !color || !Number.isFinite(size) || size < 24 || size > 72 || !inUnitRange(x) || !inUnitRange(y)) {
          throw new CheckoutError('Invalid embroidered text design')
        }
        cleanSide.texts.push({ id, value: content, color, fontStyle, layout, size, x, y })
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
          : Boolean(catalogId && /^[a-z0-9-]{1,80}$/i.test(catalogId))
        if (!/^[a-z0-9-]{1,80}$/i.test(id) || ids.has(id) || !source || !validSource || !name || !Number.isFinite(widthInches) || widthInches < 2 || widthInches > 6 || !inUnitRange(x) || !inUnitRange(y)) {
          throw new CheckoutError('Invalid jacket artwork')
        }
        ids.add(id)
        return { id, source, catalogId, url, name, color, fontStyle, widthInches, x, y }
      })
    }

    if (cleanSide.texts?.length || cleanSide.artworks?.length) output[view] = cleanSide
  }

  if (input.snapshotUrl != null) {
    if (typeof input.snapshotUrl !== 'string' || !/^https:\/\//i.test(input.snapshotUrl) || input.snapshotUrl.length > 1000) {
      throw new CheckoutError('Invalid design snapshot URL')
    }
    output.snapshotUrl = input.snapshotUrl.trim()
  }
  if (input.snapshots != null) {
    if (typeof input.snapshots !== 'object' || Array.isArray(input.snapshots)) throw new CheckoutError('Invalid design snapshots')
    const snapshots = input.snapshots as Record<string, unknown>
    output.snapshots = {}
    for (const view of JACKET_VIEWS) {
      const url = snapshots[view]
      if (url == null) continue
      if (typeof url !== 'string' || !/^https:\/\//i.test(url) || url.length > 1000 || (!output[view] && !output.varsityOptions && !output.garmentOptions)) {
        throw new CheckoutError('Invalid design snapshot URL')
      }
      output.snapshots[view] = url.trim()
    }
  }
  return output.garmentOptions || output.varsityOptions || JACKET_VIEWS.some((view) => output[view]) ? output : undefined
}

function inUnitRange(value: number) {
  return Number.isFinite(value) && value >= 0.08 && value <= 0.92
}

export async function resolveCheckoutItems(rawItems: unknown) {
  if (!Array.isArray(rawItems) || rawItems.length < 1 || rawItems.length > 100) {
    throw new CheckoutError('Checkout requires between 1 and 100 cart items')
  }
  // Aggregate every line for a product so split lines cannot bypass stock checks.
  const quantities = new Map<string, number>()
  for (const raw of rawItems) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) ||
      typeof raw.productId !== 'string' || !Number.isSafeInteger(raw.quantity) || raw.quantity < 1 || raw.quantity > 1000 ||
      typeof raw.price !== 'number' || !Number.isFinite(raw.price) || raw.price < 0) {
      throw new CheckoutError('Invalid checkout item, quantity or price')
    }
    const key = raw.productId.toLowerCase()
    quantities.set(key, (quantities.get(key) || 0) + raw.quantity)
  }
  const items: Awaited<ReturnType<typeof resolveCheckoutItem>> = []
  for (const raw of rawItems) {
    items.push(...await resolveCheckoutItem(raw, quantities.get(raw.productId.toLowerCase())!))
  }
  return items
}

async function resolveCheckoutItem(input: CheckoutItemInput, requestedQuantity: number) {
  const category = getGarmentCategory(input?.productId)
  if (category) {
    const customization = sanitizeCustomization(input.customization, 24)
    if (!customization?.garmentOptions || customization.garmentCategory !== category) throw new CheckoutError('Jacket configuration does not match the category')
    const price = Number((getGarmentPrice(category, customization.garmentOptions) + getCustomizationFee(customization)).toFixed(2))
    if (!Number.isFinite(input.price) || Math.abs(input.price - price) > .01) throw new CheckoutError('Jacket price has changed. Refresh your cart.', 409)
    return [{ productId: input.productId, name: `Custom ${GARMENT_TEMPLATES[category].name}`, image: customization.snapshotUrl || `data:image/svg+xml;charset=utf-8,${encodeURIComponent(getGarmentSvg(category, customization.garmentOptions, 'front'))}`, price, quantity: input.quantity, variants: Object.entries(customization.garmentOptions).map(([name, value]) => ({ name, value })), customization }]
  }
  if (input?.productId === VARSITY_TEMPLATE_ID) {
    const customization = sanitizeCustomization(input.customization, 24)
    if (!customization?.varsityOptions || customization.garmentOptions) throw new CheckoutError('Varsity jacket configuration is required')
    const price = Number((getVarsityPrice(customization.varsityOptions) + getCustomizationFee(customization)).toFixed(2))
    if (!Number.isFinite(input.price) || Math.abs(input.price - price) > 0.01) throw new CheckoutError('Jacket price has changed. Refresh your cart.', 409)
    return [{ productId: VARSITY_TEMPLATE_ID, name: 'Custom Varsity Jacket',
      image: customization.snapshotUrl || `data:image/svg+xml;charset=utf-8,${encodeURIComponent(getVarsitySvg(customization.varsityOptions, 'front'))}`,
      price, quantity: input.quantity, variants: Object.entries(customization.varsityOptions).map(([name, value]) => ({ name, value })), customization }]
  }
  if (!mongoose.isValidObjectId(input?.productId)) {
    throw new CheckoutError('Invalid checkout item')
  }
  const product = await Product.findById(input.productId).lean()
  if (!product || product.status !== 'active' || !product.inStock || !Number.isSafeInteger(product.stockCount) || Number(product.stockCount) < requestedQuantity) {
    throw new CheckoutError('This jacket is unavailable or has insufficient stock', 409)
  }

  const variants = input.variants ?? []
  if (!Array.isArray(variants)) throw new CheckoutError('Invalid jacket options')
  const seen = new Set<string>()
  const productVariants = getProductVariants(product)
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
      if (!product.measurementFields?.includes(field) || (!/^\d+(?:\.\d+)?in$/.test(value) || !Number.isFinite(Number(value.slice(0, -2))) || Number(value.slice(0, -2)) <= 0)) {
        throw new CheckoutError('Invalid jacket measurement')
      }
      continue
    }
    const option = productVariants.find((item) => item.name === name && item.value === value && item.inStock)
    if (!option) throw new CheckoutError('A selected jacket option is unavailable')
    unitPrice += Number(option.priceAdjust || 0)
  }
  if (!productVariants.some(option => option.name.trim().toLowerCase() === 'size' && option.inStock &&
    variants.some(variant => variant.name.trim() === option.name && variant.value.trim() === option.value))) {
    throw new CheckoutError('Please choose an available size for this product')
  }
  const customization = sanitizeCustomization(input.customization, Number(product.embroidery?.maxChars || 24))
  if (customization?.varsityOptions || customization?.garmentOptions) throw new CheckoutError('Invalid product customization')
  if (customization) {
    unitPrice += getCustomizationFee(customization)
  }

  unitPrice = Number(unitPrice.toFixed(2))

  // NOTE: input.price from frontend already includes customization fees calculated by getCustomizationFee,
  // so the comparison here is valid and ensures frontend and backend calculations match.
  if (!Number.isFinite(unitPrice) || unitPrice < 0 || Math.abs(input.price - unitPrice) > 0.01) {
    throw new CheckoutError('Jacket price has changed. Refresh your cart before checking out.', 409)
  }

  return [{
    productId: String(product._id),
    name: product.name,
    image: product.images?.[0]?.url || '/placeholder.png',
    price: unitPrice,
    quantity: input.quantity,
    variants: variants.map((variant) => ({ name: variant.name.trim(), value: variant.value.trim() })),
    customization,
  }]
}

export async function resolveCheckoutDiscount(rawCode: unknown, subtotal: number) {
  if (rawCode != null && (typeof rawCode !== 'string' || rawCode.length > 100)) throw new CheckoutError('Invalid promo code')
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
