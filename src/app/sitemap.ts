import { MetadataRoute } from 'next'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import BlogPost from '@/models/BlogPost'
import BlogCategory from '@/models/BlogCategory'
import { getStaticProducts, getStaticCategories } from '@/lib/static-data'
import { resolveAncestorChain, buildCategoryUrl, buildProductUrl } from '@/lib/categories'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'

  // Static routes
  const staticRoutes = [
    { path: '',              priority: 1.0, freq: 'daily'   },
    { path: '/contact',      priority: 0.7, freq: 'monthly' },
    { path: '/blog',         priority: 0.8, freq: 'daily'   },
    { path: '/faq',          priority: 0.7, freq: 'monthly' },
    { path: '/shipping',     priority: 0.6, freq: 'monthly' },
    { path: '/returns',      priority: 0.6, freq: 'monthly' },
    { path: '/track-order',  priority: 0.5, freq: 'monthly' },
    { path: '/privacy-policy',   priority: 0.3, freq: 'yearly'  },
    { path: '/terms-of-service', priority: 0.3, freq: 'yearly'  },
    { path: '/cookie-policy',    priority: 0.3, freq: 'yearly'  },
    { path: '/register',     priority: 0.5, freq: 'monthly' },
  ].map(({ path, priority, freq }) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: freq as 'daily' | 'monthly' | 'yearly',
    priority,
  }))


  let productsList: any[] = []
  let categoriesList: Array<{ _id: string; name: string; slug: string; parentId?: string | null; updatedAt: Date }> = []
  let blogPostsList: Array<{ slug: string; updatedAt: Date }> = []
  let blogCategoriesList: Array<{ slug: string; updatedAt: Date }> = []

  try {
    const db = await connectDB()
    if (db) {
      const dbProducts = await Product.find({}).lean()
      const dbCategories = await Category.find({}).lean()
      const dbBlogPosts = await BlogPost.find({ status: 'published' }).select('slug updatedAt categories').lean()
      const dbBlogCategories = await BlogCategory.find({}).select('slug updatedAt').lean()
      const usedCategoryIds = new Set(
        dbBlogPosts.flatMap((p: any) => (p.categories || []).map((id: any) => String(id)))
      )
      blogCategoriesList = dbBlogCategories
        .filter((c: any) => usedCategoryIds.has(String(c._id)))
        .map((c: any) => ({ slug: c.slug, updatedAt: c.updatedAt || new Date() }))

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

      blogPostsList = dbBlogPosts.map((b: any) => ({
        slug: b.slug,
        updatedAt: b.updatedAt || new Date(),
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

  const blogRoutes = blogPostsList.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const blogCategoryRoutes = blogCategoriesList.map((category) => ({
    url: `${baseUrl}/blog/category/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...blogRoutes, ...blogCategoryRoutes]
}
