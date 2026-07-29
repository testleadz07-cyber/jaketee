import { MetadataRoute } from 'next'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { getStaticProducts, getStaticCategories } from '@/lib/static-data'
import { resolveAncestorChain, buildCategoryUrl, buildProductUrl } from '@/lib/categories'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'

  // Static routes
  const staticRoutes = [
    '',
    '/contact',
    '/shipping',
    '/returns',
    '/login',
    '/register',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  let productsList: any[] = []
  let categoriesList: Array<{ _id: string; name: string; slug: string; parentId?: string | null; updatedAt: Date }> = []

  try {
    const db = await connectDB()
    if (db) {
      const dbProducts = await Product.find({}).lean()
      const dbCategories = await Category.find({}).lean()

      categoriesList = dbCategories.map((c: any) => ({
        _id: String(c._id),
        name: c.name,
        slug: c.slug,
        parentId: c.parentId ? String(c.parentId) : null,
        updatedAt: new Date(),
      }))

      productsList = dbProducts.map((p: any) => ({
        id: String(p._id),
        slug: p.slug,
        categoryId: p.categoryId ? String(p.categoryId) : null,
        updatedAt: p.updatedAt || new Date(),
      }))
    }
  } catch (error) {
    console.error('Error fetching data for sitemap:', error)
  }

  // Fallback to static data if no DB or empty
  if (categoriesList.length === 0) {
    categoriesList = getStaticCategories().map((c: any) => ({
      _id: String(c._id ?? c.id),
      name: c.name,
      slug: c.slug,
      parentId: c.parentId ? String(c.parentId) : null,
      updatedAt: new Date(),
    }))
  }
  if (productsList.length === 0) {
    productsList = getStaticProducts().map((p: any) => ({
      id: p.id || p._id,
      slug: p.slug || p.id,
      categoryId: p.categoryId ? String(p.categoryId) : null,
      updatedAt: new Date(),
    }))
  }

  // Dynamic category routes - nested (root-level) URLs, e.g. /varsity-jackets
  // or /varsity-jackets/wool-leather.
  const categoryRoutes = categoriesList.map((category) => {
    const chain = resolveAncestorChain(categoriesList, category._id)
    return {
      url: `${baseUrl}${buildCategoryUrl(chain)}`,
      lastModified: category.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }
  })

  // Dynamic product routes - nested under their full category path, e.g.
  // /bomber-jackets/product-name or /varsity-jackets/wool-leather/product-name.
  const productRoutes = productsList.map((product) => {
    const chain = product.categoryId ? resolveAncestorChain(categoriesList, product.categoryId) : []
    return {
      url: `${baseUrl}${buildProductUrl({ slug: product.slug || product.id, categoryPath: chain })}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }
  })

  return [...staticRoutes, ...productRoutes, ...categoryRoutes]
}
