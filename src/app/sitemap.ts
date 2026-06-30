import { MetadataRoute } from 'next'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { getStaticProducts, getStaticCategories } from '@/lib/static-data'

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
  let categoriesList: any[] = []

  try {
    const db = await connectDB()
    if (db) {
      const dbProducts = await Product.find({}).lean()
      const dbCategories = await Category.find({}).lean()

      productsList = dbProducts.map((p) => ({
        id: String(p._id),
        slug: p.slug,
        updatedAt: p.updatedAt || new Date(),
      }))

      categoriesList = dbCategories.map((c) => ({
        slug: c.slug,
        updatedAt: new Date(),
      }))
    }
  } catch (error) {
    console.error('Error fetching data for sitemap:', error)
  }

  // Fallback to static data if no DB or empty
  if (productsList.length === 0) {
    productsList = getStaticProducts().map((p) => ({
      id: p.id || p._id,
      slug: p.slug || p.id,
      updatedAt: new Date(),
    }))
  }
  if (categoriesList.length === 0) {
    categoriesList = getStaticCategories().map((c) => ({
      slug: c.slug,
      updatedAt: new Date(),
    }))
  }

  // Dynamic product routes
  const productRoutes = productsList.map((product) => ({
    url: `${baseUrl}/product/${product.slug || product.id}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Dynamic category routes
  const categoryRoutes = categoriesList.map((category) => ({
    url: `${baseUrl}/?category=${category.slug}`,
    lastModified: new Date(category.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...productRoutes, ...categoryRoutes]
}
