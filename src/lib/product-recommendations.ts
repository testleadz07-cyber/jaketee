import { publicRead } from '@/lib/public-cache'
import { getPublicCategories, getPublicCategoryCounts } from '@/lib/public-catalog'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import mongoose from 'mongoose'
import { findStaticProduct, getStaticProducts } from '@/lib/static-data'
import { resolveAncestorChain } from '@/lib/categories'

async function loadRecommendations(id: string, initialProduct?: any) {
  try {
    const db = await connectDB()
    if (!db && process.env.NODE_ENV === 'production' && process.env.MIGRATION_TEST_MODE !== 'true') return { frequentlyBoughtTogether: [], youMayAlsoLike: [] }
    let baseProduct: any = initialProduct ? { ...initialProduct, categoryId: initialProduct.categoryId?._id || initialProduct.categoryId } : null

    if (db && !baseProduct) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        baseProduct = await Product.findOne({ _id: id, isDraft: { $ne: true }, status: 'active' }).lean()
      }
      if (!baseProduct) {
        baseProduct = await Product.findOne({ slug: id, isDraft: { $ne: true }, status: 'active' }).lean()
      }
    }

    if (!baseProduct && (process.env.NODE_ENV !== 'production' || process.env.MIGRATION_TEST_MODE === 'true')) {
      baseProduct = findStaticProduct(id)
    }

    if (!baseProduct) {
      return null
    }

    const baseProductId = String(baseProduct._id || baseProduct.id)
    const categoryIdStr = String(baseProduct.categoryId)

    let relatedProducts: any[] = []

    if (db) {
      const allCategories = await getPublicCategories()
      const categoryChainNodes = allCategories.map((c: any) => ({
        _id: String(c._id),
        parentId: c.parentId ? String(c.parentId) : null,
        name: c.name,
        slug: c.slug,
      }))
      const mapProduct = (product: any) => {
        const category = allCategories.find(item => String(item._id) === String(product.categoryId))
        const populated = category ? { _id: category._id, name: category.name, slug: category.slug } : null
        return {
          ...product, id: String(product._id), categoryId: populated,
          category: category ? { _id: String(category._id), name: category.name, slug: category.slug } : null,
          categoryPath: category ? resolveAncestorChain(categoryChainNodes, String(category._id)).map(item => ({ name: item.name, slug: item.slug })) : [],
        }
      }

      // Fetch in-stock products in the same category (excluding current)
      const excludedIds = mongoose.Types.ObjectId.isValid(baseProductId)
        ? [new mongoose.Types.ObjectId(baseProductId)]
        : []
      const query: any = {
        inStock: true,
        isDraft: { $ne: true },
        status: 'active',
        _id: { $nin: excludedIds },
      }

      if (baseProduct.categoryId && mongoose.Types.ObjectId.isValid(String(baseProduct.categoryId))) {
        query.categoryId = baseProduct.categoryId
      }

      relatedProducts = await Product.find(query)
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(4)
        .lean()

      relatedProducts = relatedProducts.map(mapProduct)

      // If we don't have enough, backfill with featured products from other categories
      if (relatedProducts.length < 4) {
        const extra = await Product.find({
          inStock: true,
          isDraft: { $ne: true },
          status: 'active',
          _id: { $nin: [...excludedIds, ...relatedProducts.map(p => new mongoose.Types.ObjectId(p.id))] }
        })
            .sort({ isFeatured: -1, createdAt: -1 })
          .limit(4 - relatedProducts.length)
          .lean()

        relatedProducts = [...relatedProducts, ...extra.map(mapProduct)]
      }
    } else {
      // Fallback using static data
      const allStatic = getStaticProducts()
      relatedProducts = allStatic.filter(
        (p) => String(p.categoryId) === categoryIdStr && p.id !== baseProductId && p.inStock
      )

      if (relatedProducts.length < 4) {
        const extra = allStatic.filter(
          (p) => String(p.categoryId) !== categoryIdStr && p.id !== baseProductId && p.inStock
        )
        relatedProducts = [...relatedProducts, ...extra].slice(0, 4)
      }
    }

    // Keep the legacy companion response while showing four distinct recommendations.
    const frequentlyBoughtTogether = relatedProducts.slice(0, 2)
    const youMayAlsoLike = relatedProducts.slice(0, 4)

    return { frequentlyBoughtTogether, youMayAlsoLike }
  } catch (error: any) {
    console.error('Error fetching recommendations:', error)
    throw error
  }
}

export async function getProductRecommendations(id: string, initialProduct?: any) {
  try {
    return await publicRead('recommendations', [id, initialProduct?.categoryId?._id || initialProduct?.categoryId || null], 60, ['public-products'], async () => {
      if (!await connectDB()) throw new Error('Recommendations unavailable')
      return loadRecommendations(id, initialProduct)
    })
  } catch {
    if (process.env.NODE_ENV === 'production' && process.env.MIGRATION_TEST_MODE !== 'true') return { frequentlyBoughtTogether: [], youMayAlsoLike: [] }
    try { return await loadRecommendations(id, initialProduct) }
    catch { return { frequentlyBoughtTogether: [], youMayAlsoLike: [] } }
  }
}
