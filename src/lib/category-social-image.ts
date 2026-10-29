import { publicRead } from '@/lib/public-cache'
import { getPublicCategories } from '@/lib/public-catalog'
import { cache } from 'react'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import { getStaticCategories, getStaticProducts } from '@/lib/static-data'
import { resolveDescendantIds } from '@/lib/categories'
import { socialImageUrl } from '@/lib/seo-metadata'

/** Follow the collection's featured/newest product ordering, including descendants. */
export const categorySocialImage = cache(async (categoryId: string, page = 1) => {
  const db = await connectDB()
  if (db) {
    const categories = await getPublicCategories()
    const ids = resolveDescendantIds(categories, categoryId)
    const product = await publicRead('category-social-image', [categoryId, page], 60, ['public-products', 'public-categories'], async () => Product.findOne({
      categoryId: { $in: ids }, inStock: true, isDraft: { $ne: true }, status: 'active',
    }).sort({ isFeatured: -1, createdAt: -1 }).skip((page - 1) * 24).select('images').lean())
    return socialImageUrl(product?.images?.[0]?.url)
  }
  const ids = new Set(resolveDescendantIds(getStaticCategories(), categoryId))
  const products: Array<{ images: Array<{ url: string }> }> = getStaticProducts().filter(product => ids.has(product.categoryId) && product.inStock)
  return socialImageUrl(products[(page - 1) * 24]?.images?.[0]?.url)
})
