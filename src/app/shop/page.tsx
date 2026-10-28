import { getPublicCategories, getPublicCategoryCounts } from '@/lib/public-catalog'
import { withSocialMetadata } from '@/lib/seo-metadata'
import type { Metadata } from 'next'
import { getCatalogProducts, getSearchFacetProducts } from '@/lib/catalog-products'
import { catalogSortValue } from '@/lib/product-search'

import { readCatalogFilters, catalogFilterQuery, getCatalogFacetData } from '@/lib/catalog-filters'
import { collectionDesignImages } from '@/lib/collection-design-images'
import { getCustomDesignImages } from '@/components/custom-design-section'
import { connectDB } from '@/lib/mongodb'
import { resolveAncestorChain, resolveDescendantIds, type CategoryNode } from '@/lib/categories'
import ShopClient, { type Category, type Product } from './shop-client'

export const revalidate = 60

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
  const query = await searchParams
  const params = new URLSearchParams(Object.entries(query).flatMap(([key, value]) => (Array.isArray(value) ? value : value === undefined ? [] : [value]).map(item => [key, item])))
  const filters = readCatalogFilters(params)
  const category = params.get('category') || 'all'
  const sort = catalogSortValue(params.get('sort'), Boolean(filters.search))
  const page = Math.max(1, parseInt(params.get('page') || '1') || 1)
  const rawCategories = await getPublicCategories()
  const nodes: CategoryNode[] = rawCategories.map((item) => ({
    _id: String(item._id), parentId: item.parentId ? String(item.parentId) : null,
  }))
  const chainNodes = rawCategories.map((item) => ({
    _id: String(item._id),
    parentId: item.parentId ? String(item.parentId) : null,
    name: item.name,
    slug: item.slug,
  }))
  const selectedCategory = rawCategories.find((item) => item.slug === category)
  const categoryIds = category === 'all' ? null : selectedCategory ? resolveDescendantIds(nodes, String(selectedCategory._id)) : []
  const filter: Record<string, unknown> = { inStock: true, isDraft: { $ne: true }, status: 'active' }
  if (categoryIds) filter.categoryId = { $in: categoryIds }
  const facetFilter = { ...filter }
  Object.assign(filter, catalogFilterQuery(filters))

  const [catalog, counts, facetProducts] = await Promise.all([
    getCatalogProducts({ filter, search: filters.search, selectedColors: filters.color, categories: rawCategories, sort, page, limit: 24 }),
    getPublicCategoryCounts(),
    getSearchFacetProducts(facetFilter, filters.search, rawCategories),
  ])
  const { products: rawProducts, total } = catalog
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
    searchMatch: item.searchMatch,
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
