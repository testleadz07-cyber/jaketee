import { publicRead } from '@/lib/public-cache'
import 'server-only'
import { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import ProductModel from '@/models/Product'
import CategoryModel from '@/models/Category'
import { resolveAncestorChain, resolveDescendantIds, type CategoryNode } from '@/lib/categories'
import { selectHomeFeatured } from '@/lib/home-featured'
import { curatedCategorySlugs } from '@/lib/curated-category-slugs'
import type { Category, Product } from '@/app/home-client'

async function loadHomeCatalog() {
  if (!(await connectDB())) throw new Error('Catalog is temporarily unavailable')

  const rawCategories = await CategoryModel.find().select('name slug description image parentId').lean()
  const nodes: CategoryNode[] = rawCategories.map((item) => ({
    _id: String(item._id), parentId: item.parentId ? String(item.parentId) : null,
  }))
  const chainNodes = rawCategories.map((item) => ({
    _id: String(item._id),
    parentId: item.parentId ? String(item.parentId) : null,
    name: item.name,
    slug: item.slug,
  }))
  const cardFields = 'name slug description price compareAtPrice compareAtPriceVerified images categoryId isFeatured inStock'
  const tileFacets = Object.fromEntries(curatedCategorySlugs.map((slug, index) => {
    const category = rawCategories.find(item => item.slug === slug)
    const ids = category ? resolveDescendantIds(nodes, String(category._id)).map(id => new Types.ObjectId(id)) : []
    return ['tile' + index, [{ $match: { categoryId: { $in: ids } } }, { $sort: { isFeatured: -1, createdAt: -1 } }, { $limit: 4 }, { $project: { images: 1, name: 1 } }]]
  }))
  const [summary, rawFeatured, rawNewest] = await Promise.all([
    ProductModel.aggregate([
      { $match: { inStock: true, isDraft: { $ne: true }, status: 'active' } },
      { $facet: {
        groups: [
          { $sort: { isFeatured: -1, createdAt: -1, _id: 1 } },
          { $group: { _id: '$categoryId', count: { $sum: 1 }, products: { $push: '$_id' } } },
          { $project: { count: 1, products: { $slice: ['$products', Math.max(rawCategories.length, 1)] } } },
        ],
        ...tileFacets,
      } },
    ]),
    ProductModel.find({ inStock: true, isDraft: { $ne: true }, status: 'active' }).select('_id').sort({ isFeatured: -1, createdAt: -1 }).limit(4).lean(),
    ProductModel.find({ inStock: true, isDraft: { $ne: true }, status: 'active' }).select(cardFields).sort({ createdAt: -1 }).limit(8).lean(),
  ])
  const candidateGroups: Array<{ _id: unknown; count: number; products: unknown[] }> = summary[0]?.groups || []
  const counts = candidateGroups
  const countById = new Map<string, number>(counts.map((row) => [String(row._id), row.count]))
  const categories: Category[] = rawCategories.map((item) => ({
    id: String(item._id),
    name: item.name,
    slug: item.slug,
    description: item.description,
    image: item.image,
    parentId: item.parentId ? String(item.parentId) : null,
    _count: {
      products: resolveDescendantIds(nodes, String(item._id))
        .reduce((sum, id) => sum + (countById.get(id) ?? 0), 0),
    },
  }))
  const mapProduct = (item: typeof rawFeatured[number]): Product => {
    const productCategory = rawCategories.find(category => String(category._id) === String(item.categoryId))
    return {
      id: String(item._id),
      name: item.name,
      slug: item.slug,
      description: item.description ?? '',
      price: item.price,
      compareAtPrice: item.compareAtPrice ?? null,
      compareAtPriceVerified: item.compareAtPriceVerified ?? false,
      images: (item.images ?? []).map((image) => ({ url: image.url, alt: image.alt ?? item.name })),
      category: productCategory ? { name: String(productCategory.name), slug: String(productCategory.slug) } : undefined,
      categoryPath: productCategory
        ? resolveAncestorChain(chainNodes, String(productCategory._id)).map((node) => ({ name: node.name, slug: node.slug }))
        : [],
      isFeatured: item.isFeatured ?? false,
      inStock: item.inStock,
    }
  }
  const legacyFeatured = new Set(rawFeatured.map(item => String(item._id)))
  const excludedFeaturedCategoryIds = new Set(
    categories.filter(category => ['patches-embroidery', 'patches', 'embroidery'].includes(category.slug))
      .flatMap(category => resolveDescendantIds(nodes, category.id))
  )
  const coverage = selectHomeFeatured(categories.filter(category => !excludedFeaturedCategoryIds.has(category.id)), new Map<string, string[]>(candidateGroups.map(group => [
    String(group._id), group.products.map((id: unknown) => String(id)),
  ])), curatedCategorySlugs)
  if (coverage.unmatched.length) {
    console.warn('Homepage categories without a unique eligible product:', coverage.unmatched.map(category => category.slug))
  }
  const selectedRows = await ProductModel.find({ _id: { $in: coverage.selections.map(selection => selection.productId) }, inStock: true, isDraft: { $ne: true }, status: 'active' })
    .select(cardFields).lean()
  const selectedProducts = new Map<string, Product>(selectedRows.map(item => [String(item._id), mapProduct(item)]))
  const featuredProducts = coverage.selections.flatMap(({ category, productId }) => {
    const product = selectedProducts.get(productId)
    return product ? [{ ...product, featuredCategory: { name: category.name, slug: category.slug } }] : []
  })
  const newArrivals = rawNewest.map(mapProduct)
    .filter((item) => !legacyFeatured.has(item.id))
    .slice(0, 4)
  const categoryImages: Record<string, { url: string; alt: string }> = {}
  curatedCategorySlugs.forEach((slug, index) => {
    const rows = (summary[0]?.['tile' + index] || []) as Array<{ name: string; images?: Array<{ url: string; alt?: string }> }>
    const product = rows.find(row => row.images?.some(image => image.url))
    const image = product?.images?.find(image => image.url)
    if (image) categoryImages[slug] = { url: image.url, alt: image.alt ?? product?.name ?? '' }
  })
  return { categories, featuredProducts, newArrivals, categoryImages }
}

export const getHomeCatalog = () => publicRead('home-catalog-v1', [], 60, ['homepage'], loadHomeCatalog)
