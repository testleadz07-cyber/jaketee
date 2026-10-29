import 'server-only'
import { cache } from 'react'
import { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import { publicRead } from '@/lib/public-cache'

async function loadCategories() {
  if (!await connectDB()) throw new Error('Categories unavailable')
  return Category.find().lean()
}

const cachedCategories = cache(async () => publicRead('categories', [], 300, ['public-categories'], loadCategories))
// Normalize omitted/false arguments so metadata and page rendering share one read.
// Proxy requests cannot access the App Router data cache.
export function getPublicCategories(uncached = false) { return uncached ? loadCategories() : cachedCategories() }

export const getPublicCategoryCounts = cache(async () => publicRead('category-counts', [], 60, ['public-catalog'], async () => {
  if (!await connectDB()) throw new Error('Catalog unavailable')
  return Product.aggregate([
    { $match: { inStock: true, isDraft: { $ne: true }, status: 'active' } },
    { $sort: { isFeatured: -1, createdAt: -1, _id: 1 } },
    { $group: { _id: '$categoryId', count: { $sum: 1 }, image: { $first: { $arrayElemAt: ['$images.url', 0] } }, name: { $first: '$name' }, productImages: { $push: '$images.url' } } },
  ])
}))

class MissingProduct extends Error {}
export const getPublicProduct = cache(async (id: string, uncached = false) => {
  try {
    const load = async () => {
      if (!await connectDB()) throw new Error('Product unavailable')
      const visible = { isDraft: { $ne: true }, status: 'active' }
      const product = (Types.ObjectId.isValid(id) ? await Product.findOne({ _id: id, ...visible }).populate('categoryId', 'name slug').lean() : null)
        || await Product.findOne({ slug: id, ...visible }).populate('categoryId', 'name slug').lean()
      // Do not cache misses for a minute after a new product is published.
      if (!product) throw new MissingProduct()
      return product
    }
    return await (uncached ? load() : publicRead('product', id, 60, ['public-products'], load))
  } catch (error) { if (error instanceof MissingProduct) return null; throw error }
})
