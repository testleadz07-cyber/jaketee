import { MetadataRoute } from 'next'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import BlogPost from '@/models/BlogPost'
import BlogCategory from '@/models/BlogCategory'
import Faq from '@/models/Faq'
import { resolveAncestorChain, buildCategoryUrl, buildProductUrl } from '@/lib/categories'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.jacketee.com'

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/shop',
    '/about',
    '/contact',
    '/blog',
    '/faq',
    '/how-to-customize',
    '/design/varsity',
    '/design/bomber',
    '/design/coach',
    '/design/puffer',
    '/blog/custom-jacket-design-guide',
    '/blog/custom-varsity-jacket-design-guide',
    '/size-guide',
    '/track-order',
    '/materials-colors',
    '/patches-embroidery',
    '/custom-bomber-jackets',
    '/custom-coach-jackets',
    '/custom-denim-jackets',
    '/custom-puffer-jackets',
    '/custom-hoodies',
    '/custom-letterman-jackets',
    '/bulk-orders',
    '/bulk-orders/schools',
    '/bulk-orders/corporate',
    '/bulk-orders/private-label',
    '/bulk-orders/sorority-fraternity',
    '/bulk-orders/senior-class',
    '/bulk-orders/cheer',
    '/varsity-jackets/oversized',
    '/varsity-jackets/vintage',
    '/shipping',
    '/returns',
    '/privacy-policy',
    '/terms-of-service',
    '/cookie-policy',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
  }))


  let productsList: any[] = []
  let categoriesList: Array<{ _id: string; name: string; slug: string; parentId?: string | null; updatedAt?: Date }> = []
  let blogPostsList: Array<{ slug: string; updatedAt?: Date }> = []
  let blogCategoriesList: Array<{ slug: string; updatedAt?: Date }> = []

  try {
    const db = await connectDB()
    if (!db) throw new Error('Sitemap content is temporarily unavailable')
    if (db) {
      const dbProducts = await Product.find({ isDraft: { $ne: true }, status: 'active' }).lean()
      const latestFaq = await Faq.findOne({ status: { $ne: 'draft' } }).select('updatedAt').sort({ updatedAt: -1 }).lean() as { updatedAt?: Date } | null
      const faqRoute = staticRoutes.find(route => route.url === `${baseUrl}/faq`)
      if (faqRoute && latestFaq?.updatedAt) faqRoute.lastModified = latestFaq.updatedAt
      const dbCategories = await Category.find({}).lean()
      const dbBlogPosts = await BlogPost.find({ status: 'published' }).select('slug updatedAt categories').lean()
      const dbBlogCategories = await BlogCategory.find({}).select('slug updatedAt').lean()
      const usedCategoryIds = new Set(
        dbBlogPosts.flatMap((p: any) => (p.categories || []).map((id: any) => String(id)))
      )
      blogCategoriesList = dbBlogCategories
        .filter((c: any) => usedCategoryIds.has(String(c._id)))
        .map((c: any) => ({ slug: c.slug, updatedAt: c.updatedAt }))

      categoriesList = dbCategories.map((c: any) => ({
        _id: String(c._id),
        name: c.name,
        slug: c.slug,
        parentId: c.parentId ? String(c.parentId) : null,
        updatedAt: c.updatedAt,
      }))

      productsList = dbProducts.map((p: any) => ({
        id: String(p._id),
        slug: p.slug,
        categoryId: p.categoryId ? String(p.categoryId) : null,
        updatedAt: p.updatedAt,
      }))

      blogPostsList = dbBlogPosts.map((b: any) => ({
        slug: b.slug,
        updatedAt: b.updatedAt,
      }))
    }
  } catch (error) {
    console.error('Error fetching data for sitemap:', error)
    throw error
  }

  // Dynamic category routes - nested (root-level) URLs, e.g. /varsity-jackets
  // or /varsity-jackets/wool-leather.
  const categoryRoutes = categoriesList.map((category) => {
    const chain = resolveAncestorChain(categoriesList, category._id)
    return {
      url: `${baseUrl}${buildCategoryUrl(chain)}`,
      lastModified: category.updatedAt,
    }
  })

  // Dynamic product routes - nested under their full category path, e.g.
  // /bomber-jackets/product-name or /varsity-jackets/wool-leather/product-name.
  const productRoutes = productsList.map((product) => {
    const chain = product.categoryId ? resolveAncestorChain(categoriesList, product.categoryId) : []
    return {
      url: `${baseUrl}${buildProductUrl({ slug: product.slug || product.id, categoryPath: chain })}`,
      lastModified: product.updatedAt,
    }
  })

  const blogRoutes = blogPostsList.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
  }))

  const blogCategoryRoutes = blogCategoriesList.map((category) => ({
    url: `${baseUrl}/blog/category/${category.slug}`,
    lastModified: category.updatedAt,
  }))

  const routes = [...staticRoutes, ...productRoutes, ...categoryRoutes, ...blogRoutes, ...blogCategoryRoutes]
  return [...new Map(routes.map(route => [route.url, route])).values()]
}
