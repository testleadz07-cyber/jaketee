import { cache } from 'react'
import Product from '@/models/Product'

type BlogImageCandidate = {
  id: string
  name: string
  slug: string
  tags: string[]
  url: string
}

type BlogImageSource = {
  slug?: string
  title?: string
  featuredImage?: string | null
  tags?: string[]
  categories?: Array<{ name?: string; slug?: string } | unknown>
  taggedProducts?: unknown[]
}

const ignoredWords = new Set([
  'a', 'an', 'and', 'are', 'can', 'do', 'for', 'from', 'how', 'in', 'is', 'it', 'of', 'on',
  'or', 'the', 'to', 'vs', 'what', 'when', 'with', 'you', 'your', 'jacket', 'jackets',
])

function words(value: unknown) {
  return String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !ignoredWords.has(word))
}

function stableHash(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function isUsableImage(value: unknown): value is string {
  return typeof value === 'string'
    && value.trim() !== ''
    && !value.includes('/placeholder.png')
    && !value.includes('/_next/image?')
}

export const getBlogImageCandidates = cache(async (): Promise<BlogImageCandidate[]> => {
  const products = await Product.find({
    inStock: true,
    'images.0.url': { $exists: true, $nin: ['', null] },
  })
    .select('name slug tags images isFeatured')
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(120)
    .lean()

  return products
    .map((product: any) => ({
      id: String(product._id),
      name: product.name || '',
      slug: product.slug || '',
      tags: product.tags || [],
      url: product.images?.[0]?.url || '',
    }))
    .filter((product) => isUsableImage(product.url))
})

export function resolveBlogImage(post: BlogImageSource, candidates: BlogImageCandidate[]) {
  if (isUsableImage(post.featuredImage)) return post.featuredImage

  const taggedIds = new Set((post.taggedProducts || []).map((item: any) => String(item?._id || item?.id || item)))
  const taggedCandidate = candidates.find((candidate) => taggedIds.has(candidate.id))
  if (taggedCandidate) return taggedCandidate.url
  if (candidates.length === 0) return '/logo.png'

  const categoryText = (post.categories || []).map((category: any) => `${category?.name || ''} ${category?.slug || ''}`).join(' ')
  const targetWords = new Set(words(`${post.title || ''} ${post.slug || ''} ${(post.tags || []).join(' ')} ${categoryText}`))
  const offset = stableHash(post.slug || post.title || '') % candidates.length
  let best = candidates[offset]
  let bestScore = -1

  for (let step = 0; step < candidates.length; step += 1) {
    const candidate = candidates[(offset + step) % candidates.length]
    const candidateWords = new Set(words(`${candidate.name} ${candidate.slug} ${candidate.tags.join(' ')}`))
    const score = [...targetWords].reduce((total, word) => total + (candidateWords.has(word) ? 1 : 0), 0)
    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
  }

  return best.url
}
