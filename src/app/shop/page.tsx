import { connectDB } from '@/lib/mongodb'
import ProductModel from '@/models/Product'
import CategoryModel from '@/models/Category'
import { resolveAncestorChain, resolveDescendantIds, type CategoryNode } from '@/lib/categories'
import ShopClient, { type Category, type Product } from './shop-client'

export const dynamic = 'force-dynamic'

export default async function Page({ searchParams }: {
  searchParams: Promise<{ category?: string; search?: string }>
}) {
  if (!(await connectDB())) throw new Error('Catalog is temporarily unavailable')

  const { category: requestedCategory, search } = await searchParams
  const category = requestedCategory || 'all'
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
  const categoryIds = category !== 'all'
    ? resolveDescendantIds(nodes, String(rawCategories.find((item) => item.slug === category)?._id ?? ''))
    : null
  const filter: Record<string, unknown> = { inStock: true }
  if (categoryIds) filter.categoryId = { $in: categoryIds }
  if (search?.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { slug: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
    ]
  }

  const [rawProducts, total, counts] = await Promise.all([
    ProductModel.find(filter)
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(12)
      .populate('categoryId', 'name slug')
      .lean(),
    ProductModel.countDocuments(filter),
    ProductModel.aggregate([
      { $match: { inStock: true } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]),
  ])
  const countById = new Map<string, number>(counts.map((row) => [String(row._id), row.count]))
  const categories: Category[] = rawCategories.map((item) => ({
    id: String(item._id),
    name: item.name,
    slug: item.slug,
    parentId: item.parentId ? String(item.parentId) : null,
    _count: {
      products: resolveDescendantIds(nodes, String(item._id))
        .reduce((sum, id) => sum + (countById.get(id) ?? 0), 0),
    },
  }))
  const products: Product[] = rawProducts.map((item) => ({
    id: String(item._id),
    name: item.name,
    slug: item.slug,
    description: item.description ?? '',
    price: item.price,
    compareAtPrice: item.compareAtPrice ?? null,
    images: (item.images ?? []).map((image) => ({ url: image.url, alt: image.alt ?? item.name })),
    category: item.categoryId && typeof item.categoryId === 'object' && 'name' in item.categoryId
      ? { name: String(item.categoryId.name), slug: String(item.categoryId.slug) }
      : undefined,
    categoryPath: item.categoryId && typeof item.categoryId === 'object' && 'name' in item.categoryId
      ? resolveAncestorChain(chainNodes, String(item.categoryId._id)).map((node) => ({ name: node.name, slug: node.slug }))
      : [],
    isFeatured: item.isFeatured ?? false,
    inStock: item.inStock,
  }))

  return <ShopClient
    key={`${category}:${search ?? ''}`}
    initialProducts={products}
    initialCategories={categories}
    initialTotal={total}
    initialCategory={category}
  />
}
