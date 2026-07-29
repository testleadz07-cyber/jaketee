import { cache } from 'react'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import { findStaticProduct, getStaticCategories } from '@/lib/static-data'
import { resolveAncestorChain } from '@/lib/categories'

interface ResolverCategory {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string | null
}

export interface ResolvedCategory {
  type: 'category'
  category: ResolverCategory
  ancestorChain: { name: string; slug: string }[]
}

export interface ResolvedProduct {
  type: 'product'
  product: any
}

export interface ResolvedRedirect {
  type: 'redirect'
  to: string
}

export interface ResolvedNotFound {
  type: 'notfound'
}

export type SlugResolution = ResolvedCategory | ResolvedProduct | ResolvedRedirect | ResolvedNotFound

/**
 * Resolves a root-level path (e.g. ['varsity-jackets', 'wool-leather'] or
 * ['bomber-jackets', 'some-product']) to either a category page, a product
 * page, a redirect to the correct canonical URL, or not-found.
 *
 * Cached per-request (React cache()) so layout.tsx's generateMetadata and
 * page.tsx's render both resolving the same path only does the work once.
 */
export const resolveSlugPath = cache(async (segments: string[]): Promise<SlugResolution> => {
  if (segments.length === 0) return { type: 'notfound' }
  const lastSegment = segments[segments.length - 1]

  const db = await connectDB()

  let categories: ResolverCategory[]
  if (db) {
    const all = await Category.find().lean()
    categories = all.map((c: any) => ({
      _id: String(c._id),
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      parentId: c.parentId ? String(c.parentId) : null,
    }))
  } else {
    categories = getStaticCategories().map((c: any) => ({
      _id: String(c._id ?? c.id),
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      parentId: c.parentId ? String(c.parentId) : null,
    }))
  }

  // Try resolving as a category (chain) first.
  const matchedCategory = categories.find((c) => c.slug === lastSegment)
  if (matchedCategory) {
    const chain = resolveAncestorChain(categories, matchedCategory._id)
    const chainSlugs = chain.map((c) => c.slug)
    const exactMatch = chainSlugs.length === segments.length && chainSlugs.every((s, i) => s === segments[i])

    if (exactMatch) {
      return {
        type: 'category',
        category: matchedCategory,
        ancestorChain: chain.map((c) => ({ name: c.name, slug: c.slug })),
      }
    }
    return { type: 'redirect', to: '/' + chainSlugs.join('/') }
  }

  // Otherwise, try resolving the last segment as a product slug/id.
  let product: any = null
  if (db) {
    if (mongoose.Types.ObjectId.isValid(lastSegment)) {
      product = await Product.findById(lastSegment).populate('categoryId', 'name slug').lean()
    }
    if (!product) {
      product = await Product.findOne({ slug: lastSegment }).populate('categoryId', 'name slug').lean()
    }
  }
  if (!product) {
    product = findStaticProduct(lastSegment)
  }
  if (!product) {
    return { type: 'notfound' }
  }

  const rawCategoryId = product.categoryId
  const leafCategoryId = rawCategoryId
    ? String((rawCategoryId as any)._id ?? rawCategoryId)
    : null
  const productChain = leafCategoryId ? resolveAncestorChain(categories, leafCategoryId) : []
  const productChainSlugs = productChain.map((c) => c.slug)
  const expectedPrefix = segments.slice(0, -1)
  const prefixMatches =
    productChainSlugs.length === expectedPrefix.length &&
    productChainSlugs.every((s, i) => s === expectedPrefix[i])

  if (!prefixMatches) {
    return { type: 'redirect', to: '/' + [...productChainSlugs, lastSegment].join('/') }
  }

  return {
    type: 'product',
    product: {
      ...product,
      id: String(product._id || product.id),
      categoryPath: productChain.map((c) => ({ name: c.name, slug: c.slug })),
    },
  }
})
