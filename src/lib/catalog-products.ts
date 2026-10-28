import { Types } from 'mongoose'
import Product from '@/models/Product'
import { buildProductSearch, getSearchMatch, searchFacetVariants, type SearchCategory } from '@/lib/product-search'
import { publicRead } from '@/lib/public-cache'
import { connectDB } from '@/lib/mongodb'

function castFilter(value: any, key = ''): any {
  if (key === 'categoryId' && typeof value === 'string' && Types.ObjectId.isValid(value)) return new Types.ObjectId(value)
  if (value instanceof Types.ObjectId || value instanceof Date || value instanceof RegExp) return value
  if (Array.isArray(value)) return value.map(item => castFilter(item, key))
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([childKey, item]) => [childKey, castFilter(item, key === 'categoryId' ? key : childKey)]))
  return value
}

export async function getSearchFacetProducts(filter: Record<string, any>, search: string, categories: SearchCategory[]) {
  const plan = buildProductSearch(search, categories)
  const load = async () => {
    if (!await connectDB()) throw new Error('Catalog unavailable')
    return Product.aggregate([{ $match: castFilter({ $and: [filter, plan.filter] }) }, { $project: { price: 1, variants: 1 } }])
  }
  const products = search.length <= 80 ? await publicRead('facets', [filter, search], search ? 30 : 60, ['public-catalog'], load, true) : await load()
  return products.map((product: any) => ({ ...product, variants: searchFacetVariants(product.variants || [], search) }))
}

export async function getCatalogProducts({ filter, search, categories, sort = 'featured', page = 1, limit = 24, selectedColors = [] }: {
  filter: Record<string, any>; search: string; categories: SearchCategory[]; sort?: string; page?: number; limit?: number; selectedColors?: string[]
}) {
  const plan = buildProductSearch(search, categories, selectedColors)
  const match = castFilter({ $and: [filter, plan.filter] })
  const sortOrder: Record<string, 1 | -1> = sort === 'relevance' ? { __searchScore: -1, createdAt: -1, _id: 1 } : sort === 'price-asc' ? { price: 1, _id: 1 } : sort === 'price-desc' ? { price: -1, _id: 1 } : sort === 'name' ? { name: 1, _id: 1 } : sort === 'name-desc' ? { name: -1, _id: 1 } : sort === 'newest' ? { createdAt: -1, _id: 1 } : { isFeatured: -1, createdAt: -1, _id: 1 }
  const load = async () => {
    if (!await connectDB()) throw new Error('Catalog unavailable')
    return Product.aggregate([
    { $match: match },
    ...(search && sort === 'relevance' ? [{ $addFields: { __searchScore: plan.score } }] : []),
    { $sort: sortOrder },
    { $facet: { products: [{ $skip: (page - 1) * limit }, { $limit: limit }, { $project: { __searchScore: 0 } }], total: [{ $count: 'count' }] } },
    ])
  }
  // Bound persistent cache keys: uncommon/deep searches remain fresh uncached reads.
  const eligible = page <= 10 && limit <= 100 && search.length <= 80 && JSON.stringify(filter).length < 2000
  const [result] = eligible ? await publicRead('catalog', [filter, search, selectedColors, sort, page, limit], search ? 30 : 60, ['public-catalog'], load, true) : await load()
  const byId = new Map(categories.map(category => [String(category._id), category]))
  return {
    products: (result?.products || []).map((product: any) => {
      const category = byId.get(String(product.categoryId))
      return { ...product, categoryId: category ? { _id: category._id, name: category.name, slug: category.slug } : null, searchMatch: getSearchMatch(product, search, selectedColors) }
    }),
    total: Number(result?.total?.[0]?.count || 0),
  }
}
