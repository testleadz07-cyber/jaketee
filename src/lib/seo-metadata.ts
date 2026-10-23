import type { Metadata } from 'next'

const BRAND_SUFFIX = ' | Jacketee'

/** Keep share copy tied to the page's SEO copy, including when it changes. */
export function withSocialMetadata(metadata: Metadata): Metadata {
  if (!metadata.title && !metadata.description) return metadata
  const title = metadata.title ?? undefined
  const description = metadata.description ?? undefined
  const supplied = metadata.openGraph?.images
  const candidates = supplied ? (Array.isArray(supplied) ? supplied : [supplied]) : []
  const images = (candidates.length ? candidates : ['/opengraph-image']).map(image => ({
    width: 1200, height: 630, alt: typeof title === 'string' ? title : 'Jacketee',
    ...(typeof image === 'string' || image instanceof URL ? { url: image } : image),
  }))
  return {
    ...metadata,
    openGraph: { type: 'website', ...metadata.openGraph, title, description, images } as Metadata['openGraph'],
    twitter: { card: 'summary_large_image', title, description, images },
  }
}

export function cleanMetaText(value?: string | null) {
  return (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function truncateAtWord(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  const shortened = value.slice(0, maxLength + 1)
  const boundary = shortened.lastIndexOf(' ')
  return (boundary > Math.floor(maxLength * 0.65) ? shortened.slice(0, boundary) : shortened.slice(0, maxLength)).trim()
}

export function productMetaTitle(name: string, reviewedTitle?: string | null) {
  const productName = (cleanMetaText(reviewedTitle) || cleanMetaText(name) || 'Custom Jacket').replace(/\s*\|\s*Jacketee$/i, '')
  return `${truncateAtWord(productName, 60 - BRAND_SUFFIX.length)}${BRAND_SUFFIX}`
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
