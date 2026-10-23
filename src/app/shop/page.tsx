import { withSocialMetadata } from '@/lib/seo-metadata'
import type { Metadata } from 'next'
import { readCatalogFilters, catalogFilterQuery, getCatalogFacetData } from '@/lib/catalog-filters'
import { collectionDesignImages } from '@/lib/collection-design-images'
import { getCustomDesignImages } from '@/components/custom-design-section'
import { connectDB } from '@/lib/mongodb'
import ProductModel from '@/models/Product'
import CategoryModel from '@/models/Category'
import { resolveAncestorChain, resolveDescendantIds, type CategoryNode } from '@/lib/categories'
import ShopClient, { type Category, type Product } from './shop-client'

export const dynamic = 'force-dynamic'

const SHOP_TITLE = 'Shop All Custom Jackets | Varsity, Bomber & More | Jacketee'
const SHOP_DESCRIPTION = 'Browse all custom jackets at Jacketee, including varsity, letterman, bomber, coach, puffer and denim styles. Add patches, embroidery and team colors.'

export const metadata: Metadata = withSocialMetadata({
  title: SHOP_TITLE,
  description: SHOP_DESCRIPTION,
  alternates: { canonical: 'https://www.jacketee.com/shop' },
  openGraph: {
    title: SHOP_TITLE,
    description: SHOP_DESCRIPTION,
    url: 'https://www.jacketee.com/shop',
    siteName: 'Jacketee',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SHOP_TITLE,
    description: SHOP_DESCRIPTION,
  },
})

export default async function Page({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (!(await connectDB())) throw new Error('Catalog is temporarily unavailable')

  const query = await searchParams
  const params = new URLSearchParams(Object.entries(query).flatMap(([key, value]) => (Array.isArray(value) ? value : value === undefined ? [] : [value]).map(item => [key, item])))
  const filters = readCatalogFilters(params)
  const category = params.get('category') || 'all'
  const sort = ['featured', 'newest', 'price-asc', 'price-desc', 'name'].includes(params.get('sort') || '') ? params.get('sort')! : 'featured'
  const page = Math.max(1, parseInt(params.get('page') || '1') || 1)
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
  const filter: Record<string, unknown> = { inStock: true, isDraft: { $ne: true }, status: 'active' }
  if (categoryIds) filter.categoryId = { $in: categoryIds }
  const facetFilter = { ...filter }
  Object.assign(filter, catalogFilterQuery(filters))
  const sortOrder: Record<string, 1 | -1> = sort === 'price-asc' ? { price: 1 } : sort === 'price-desc' ? { price: -1 } : sort === 'name' ? { name: 1 } : sort === 'newest' ? { createdAt: -1 } : { isFeatured: -1, createdAt: -1 }

  const [rawProducts, total, counts, facetProducts] = await Promise.all([
    ProductModel.find(filter)
      .sort({ ...sortOrder, _id: 1 })
      .skip((page - 1) * 24)
      .limit(24)
      .populate('categoryId', 'name slug')
      .lean(),
    ProductModel.countDocuments(filter),
    ProductModel.aggregate([
      { $match: { inStock: true, isDraft: { $ne: true }, status: 'active' } },
      { $sort: { isFeatured: -1, createdAt: -1, _id: 1 } },
      { $group: { _id: '$categoryId', count: { $sum: 1 }, image: { $first: { $arrayElemAt: ['$images.url', 0] } }, name: { $first: '$name' }, productImages: { $push: '$images.url' } } },
    ]),
    ProductModel.find(facetFilter).select('price variants -_id').lean(),
  ])
  const countById = new Map<string, number>(counts.map((row) => [String(row._id), row.count]))
  const imageCategories = rawCategories.map(item => ({ id: String(item._id), parentId: item.parentId ? String(item.parentId) : null, name: item.name, image: item.image || '', productImages: (counts.find(row => String(row._id) === String(item._id))?.productImages || []).flat().filter((url: unknown) => typeof url === 'string') }))
  const categories: Category[] = rawCategories.map((item) => ({
    id: String(item._id),
    name: item.name,
    slug: item.slug,
    designImages: collectionDesignImages(imageCategories, String(item._id)),
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
    compareAtPriceVerified: item.compareAtPriceVerified ?? false,
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

  const heroImages = ['varsity-jackets', 'bomber-jackets', 'puffer-jackets'].flatMap(slug => {
    const root = rawCategories.find(item => item.slug === slug)
    if (!root) return []
    const ids = resolveDescendantIds(nodes, String(root._id))
    const representative = ids.map(id => counts.find(row => String(row._id) === id)).find(row => row?.image)
    return representative ? [{ src: String(representative.image), alt: String(representative.name), label: root.name, href: `/${root.slug}` }] : []
  })

  return <ShopClient
    heroImages={heroImages}
    customDesignImages={await getCustomDesignImages()}
        initialProducts={products}
    initialCategories={categories}
    initialTotal={total}
    initialCategory={category}
    initialFilters={filters}
    initialSort={sort}
    initialPage={page}
    initialFacets={getCatalogFacetData(facetProducts)}
  />
}
