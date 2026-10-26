import { withSocialMetadata } from '@/lib/seo-metadata'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Header } from '@/components/header'
import { HomeHero, homeHeroImage } from '@/components/home-hero'
import { getHomeHeroImages } from '@/lib/home-hero-images'
import { connectDB } from '@/lib/mongodb'
import ProductModel from '@/models/Product'
import CategoryModel from '@/models/Category'
import { resolveAncestorChain, resolveDescendantIds, type CategoryNode } from '@/lib/categories'
import { selectHomeFeatured } from '@/lib/home-featured'
import { curatedCategorySlugs } from '@/lib/curated-category-slugs'
import { CustomDesignSection } from '@/components/custom-design-section'
import Home, { type Category, type Product } from './home-client'

export const dynamic = 'force-dynamic'

const defaultMetadata: Metadata = withSocialMetadata({
  title: 'Custom Varsity Jackets & Letterman Jackets | Jacketee',
  description: 'Design custom varsity jackets and letterman jackets with chenille patches, embroidery and your team colors. Bulk pricing for schools, teams and brands.',
  alternates: { canonical: 'https://www.jacketee.com/' },
  openGraph: {
    title: 'Custom Varsity Jackets & Letterman Jackets | Jacketee',
    description: 'Design custom varsity jackets and letterman jackets with chenille patches, embroidery and your team colors. Bulk pricing for schools, teams and brands.',
    url: 'https://www.jacketee.com/',
    siteName: 'Jacketee',
    type: 'website',
    images: [{ url: homeHeroImage, width: 1200, height: 630, alt: 'Jacketee custom varsity and letterman jackets' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom Varsity Jackets & Letterman Jackets | Jacketee',
    description: 'Design custom varsity jackets and letterman jackets with chenille patches, embroidery and your team colors. Bulk pricing for schools, teams and brands.',
    images: ['https://www.jacketee.com/opengraph-image'],
  },
})

export async function generateMetadata(): Promise<Metadata> {
  const { desktop } = await getHomeHeroImages()
  return withSocialMetadata({
    ...defaultMetadata,
    openGraph: { ...defaultMetadata.openGraph, images: [{ url: desktop.url, width: desktop.width || 1774, height: desktop.height || 887, alt: desktop.alt }] },
    twitter: { ...defaultMetadata.twitter, images: [desktop.url] },
  })
}

export default function Page() {
  return <div className="home-page flex min-h-screen flex-col bg-background">
    <Header home />
    <Suspense fallback={null}><HomeHero /></Suspense>
    <Suspense fallback={null}><HomeContent /></Suspense>
  </div>
}

async function HomeContent() {
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
      isDraft: { $ne: true },
      status: 'active',
      categoryId: { $in: id ? resolveDescendantIds(nodes, id) : [] },
    })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(4)
      .populate('categoryId', 'name slug')
      .lean()
  })
  const [counts, rawFeatured, rawNewest, candidateGroups, ...rawCategoryRows] = await Promise.all([
    ProductModel.aggregate([
      { $match: { inStock: true, isDraft: { $ne: true }, status: 'active' } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]),
    ProductModel.find({ inStock: true, isDraft: { $ne: true }, status: 'active' })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(4)
      .populate('categoryId', 'name slug')
      .lean(),
    ProductModel.find({ inStock: true, isDraft: { $ne: true }, status: 'active' })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('categoryId', 'name slug')
      .lean(),
    ProductModel.aggregate([
      { $match: { inStock: true, isDraft: { $ne: true }, status: 'active' } },
      { $sort: { isFeatured: -1, createdAt: -1, _id: 1 } },
      { $group: { _id: '$categoryId', products: { $push: '$_id' } } },
      { $project: { products: { $slice: ['$products', Math.max(rawCategories.length, 1)] } } },
    ]),
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
  const legacyFeatured = rawFeatured.map(mapProduct)
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
    .populate('categoryId', 'name slug').lean()
  const selectedProducts = new Map<string, Product>(selectedRows.map(item => [String(item._id), mapProduct(item)]))
  const featuredProducts = coverage.selections.flatMap(({ category, productId }) => {
    const product = selectedProducts.get(productId)
    return product ? [{ ...product, featuredCategory: { name: category.name, slug: category.slug } }] : []
  })
  const newArrivals = rawNewest.map(mapProduct)
    .filter((item) => !legacyFeatured.some((featured) => featured.id === item.id))
    .slice(0, 4)
  const categoryProducts = Object.fromEntries(
    curatedCategorySlugs.map((slug, index) => [slug, rawCategoryRows[index].map(mapProduct)])
  ) as Record<string, Product[]>

  return <Home customDesign={<Suspense fallback={null}><CustomDesignSection home /></Suspense>} categories={categories} featuredProducts={featuredProducts} newArrivals={newArrivals} categoryProducts={categoryProducts} />
}
