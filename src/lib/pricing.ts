export interface CompareAtPriceFields {
  price: number
  compareAtPrice?: number | null
  compareAtPriceVerified?: boolean
}

export function getDisplayCompareAtPrice(product: CompareAtPriceFields): number | null {
  const compareAtPrice = Number(product.compareAtPrice)
  const price = Number(product.price)

  if (!product.compareAtPriceVerified) return null
  if (!Number.isFinite(compareAtPrice) || !Number.isFinite(price)) return null
  return compareAtPrice > price ? compareAtPrice : null
}

