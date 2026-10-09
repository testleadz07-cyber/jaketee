export const DEFAULT_APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const

interface ProductVariant {
  name: string
  value: string
  priceAdjust: number
  inStock: boolean
  image?: string | null
}

export function getDefaultProductVariants(variants: ProductVariant[]): Record<string, string> {
  const defaults: Record<string, string> = {}
  for (const variant of variants) {
    if (variant.name.trim().toLowerCase() !== 'size' && variant.inStock && defaults[variant.name] === undefined) defaults[variant.name] = variant.value
  }
  const availableSizes = variants.filter(variant => variant.name.trim().toLowerCase() === 'size' && variant.inStock)
  const medium = availableSizes.find(variant => /^(m|medium)$/i.test(variant.value.trim()))
  const size = medium || availableSizes.find(variant => /^one size$/i.test(variant.value.trim()))
  if (size) defaults[size.name] = size.value
  return defaults
}

export function getProductVariants<T extends ProductVariant>(product: {
  name?: string; slug?: string; inStock: boolean; variants?: T[]
}): Array<T | ProductVariant> {
  const variants = product.variants || []
  if (variants.some(variant => variant.name.trim().toLowerCase() === 'size')) return variants
  const topic = `${product.name || ''} ${product.slug?.replace(/-/g, ' ') || ''}`
  const sizes = /\bpatch(?:es)?\b/i.test(topic) && !/\b(?:jacket|hoodie|vest|coat|bomber)\b/i.test(topic)
    ? ['One size'] : DEFAULT_APPAREL_SIZES
  return [
    ...sizes.map(value => ({ name: 'Size', value, priceAdjust: 0, inStock: product.inStock })),
    ...variants,
  ]
}
