const BRAND_SUFFIX = ' | Jacketee'

export function cleanMetaText(value?: string | null) {
  return (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function truncateAtWord(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  const shortened = value.slice(0, maxLength + 1)
  const boundary = shortened.lastIndexOf(' ')
  return (boundary > Math.floor(maxLength * 0.65) ? shortened.slice(0, boundary) : shortened.slice(0, maxLength)).trim()
}

export function productMetaTitle(name: string, customTitle?: string | null) {
  const supplied = cleanMetaText(customTitle)
  if (supplied) return truncateAtWord(supplied, 60)
  const productName = cleanMetaText(name) || 'Custom Jacket'
  const prefix = productName.toLowerCase().startsWith('custom ') ? productName : `Custom ${productName}`
  return `${truncateAtWord(prefix, 60 - BRAND_SUFFIX.length)}${BRAND_SUFFIX}`
}

export function productMetaDescription(input: { name: string; categoryName?: string | null; customDescription?: string | null }) {
  const supplied = cleanMetaText(input.customDescription)
  if (supplied) return truncateAtWord(supplied, 155)
  const name = cleanMetaText(input.name) || 'custom jacket'
  const category = cleanMetaText(input.categoryName) || 'custom jackets'
  return truncateAtWord(`Shop ${name} from our ${category} collection. Review materials, sizing and customization options, then request a free design mockup before production.`, 155)
}

export function pageMetaDescription(value: string | null | undefined, fallback: string) {
  return truncateAtWord(cleanMetaText(value) || cleanMetaText(fallback), 155)
}

export function socialImageUrl(url?: string | null) {
  const value = cleanMetaText(url)
  if (!value) return 'https://www.jacketee.com/opengraph-image'
  if (value.includes('res.cloudinary.com') && value.includes('/image/upload/')) {
    return value.replace('/image/upload/', '/image/upload/c_fill,w_1200,h_630,q_auto,f_auto/')
  }
  return value
}
