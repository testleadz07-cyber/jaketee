import { connectDB } from '@/lib/mongodb'
import ProductModel from '@/models/Product'
import CategoryModel from '@/models/Category'
import { resolveAncestorChain, resolveDescendantIds, type CategoryNode } from '@/lib/categories'
import { curatedCategorySlugs } from '@/lib/curated-category-slugs'
import Home, { type Category, type Product } from './home-client'

export const dynamic = 'force-dynamic'

export default async function Page() {
  if (!(await connectDB())) throw new Error('Catalog is temporarily unavailable')

  const rawCategories = await CategoryModel.find().lean()
  const nodes: CategoryNode[] = rawCategories.map((item) => ({
    _id: String(item._id), parentId: item.parentId ? String(item.parentId) : null,
  }))
  const chainNodes = rawCategories.map((item) => ({
    _id: String(item._id),
    parentId: item.parentId ? String(item.parentId) : null,
    name: item.name,
    slug: item.slug,
  }))
  const categoryIds = new Map(rawCategories.map((item) => [item.slug, String(item._id)]))
  const categoryQueries = curatedCategorySlugs.map((slug) => {
    const id = categoryIds.get(slug)
    return ProductModel.find({
      inStock: true,
      categoryId: { $in: id ? resolveDescendantIds(nodes, id) : [] },
    })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(4)
      .populate('categoryId', 'name slug')
      .lean()
  })
  const [counts, rawFeatured, rawNewest, ...rawCategoryRows] = await Promise.all([
    ProductModel.aggregate([
      { $match: { inStock: true } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]),
    ProductModel.find({ inStock: true })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(4)
      .populate('categoryId', 'name slug')
      .lean(),
    ProductModel.find({ inStock: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('categoryId', 'name slug')
      .lean(),
    ...categoryQueries,
  ])
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
    const productCategory = item.categoryId && typeof item.categoryId === 'object' && 'name' in item.categoryId
      ? item.categoryId : null
    return {
      id: String(item._id),
      name: item.name,
      slug: item.slug,
      description: item.description ?? '',
      price: item.price,
      compareAtPrice: item.compareAtPrice ?? null,
      images: (item.images ?? []).map((image) => ({ url: image.url, alt: image.alt ?? item.name })),
      category: productCategory ? { name: String(productCategory.name), slug: String(productCategory.slug) } : undefined,
      categoryPath: productCategory
        ? resolveAncestorChain(chainNodes, String(productCategory._id)).map((node) => ({ name: node.name, slug: node.slug }))
        : [],
      isFeatured: item.isFeatured ?? false,
      inStock: item.inStock,
    }
  }
  const featuredProducts = rawFeatured.map(mapProduct)
  const newArrivals = rawNewest.map(mapProduct)
    .filter((item) => !featuredProducts.some((featured) => featured.id === item.id))
    .slice(0, 4)
  const categoryProducts = Object.fromEntries(
    curatedCategorySlugs.map((slug, index) => [slug, rawCategoryRows[index].map(mapProduct)])
  ) as Record<string, Product[]>

  return <Home categories={categories} featuredProducts={featuredProducts} newArrivals={newArrivals} categoryProducts={categoryProducts} />
}
