import { connection, after } from 'next/server'
import { getPublicBlogPost, getPublicBlogCategories, getPublicBlogRows } from '@/lib/public-blog'
import { getPublicCategories } from '@/lib/public-catalog'
import { publicRead } from '@/lib/public-cache'
import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import Product from '@/models/Product'
import BlogPostPage, { type BlogPostDetail } from './post-client'
import { getBlogImageCandidates, resolveBlogImage } from '@/lib/blog-images'
import { buildProductUrl, resolveAncestorChain } from '@/lib/categories'
import { blogDescription, blogHeadline, blogStructuredData } from '@/lib/blog-post-seo'



export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  await connection()
  if (!(await connectDB())) throw new Error('Blog content is temporarily unavailable')

  const { slug } = await params
  const rawPost = await getPublicBlogPost(slug)
  if (!rawPost) notFound()

  const post = rawPost as any
  const categoryIds = post.categories ?? []
  const productIds = post.taggedProducts ?? []
  const [categories, taggedProducts, productCategories, imageCandidates] = await Promise.all([
    categoryIds.length
      ? getPublicBlogCategories().then(items => items.filter(item => categoryIds.some((id: unknown) => String(id) === String(item._id))))
      : [],
    productIds.length
      ? publicRead('blog-tagged-products', productIds, 60, ['public-products'], async () => Product.find({ _id: { $in: productIds }, isDraft: { $ne: true }, status: 'active' }).select('name slug categoryId price compareAtPrice compareAtPriceVerified images averageRating').lean())
      : [],
    productIds.length ? getPublicCategories() : [],
    getBlogImageCandidates(),
  ])
  const categoriesById = new Map(categories.map((category: any) => [String(category._id), category] as const))
  const productsById = new Map(taggedProducts.map((product: any) => [String(product._id), product] as const))
  const productCategoryNodes = productCategories.map((category: any) => ({
    _id: String(category._id),
    name: category.name,
    slug: category.slug,
    parentId: category.parentId ? String(category.parentId) : null,
  }))
  const resolvedCategories = categoryIds
    .map((id: any) => categoriesById.get(String(id)))
    .filter(Boolean)
  const resolvedProducts = productIds
    .map((id: any) => productsById.get(String(id)))
    .filter(Boolean)
  const related = categoryIds.length ? (await getPublicBlogRows({ categoryId: { $in: categoryIds }, excludeId: post._id, limit: 3 })).posts : []
  const currentViews = await BlogPost.findById(post._id).select('views').lean()
  after(async () => {
    try { await BlogPost.updateOne({ _id: post._id }, { $inc: { views: 1 } }, { timestamps: false }) }
    catch { console.error('Blog view count update failed') }
  })

  const detail: BlogPostDetail = {
    id: String(post._id),
    title: blogHeadline(post.title),
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.safeContent,
    featuredImage: resolveBlogImage({ ...post, categories: resolvedCategories }, imageCandidates),
    categories: resolvedCategories.map((category: any) => ({
      id: String(category._id), name: category.name, slug: category.slug,
    })),
    tags: post.tags ?? [],
    author: { name: 'Jacketee Team' },
    publishedAt: post.publishedAt?.toISOString() ?? '',
    updatedAt: post.updatedAt?.toISOString() ?? post.publishedAt?.toISOString() ?? '',
    views: (currentViews?.views ?? post.views ?? 0) + 1,
    taggedProducts: resolvedProducts.map((product: any) => ({
      id: String(product._id),
      name: product.name,
      slug: product.slug,
      href: buildProductUrl({
        slug: product.slug,
        categoryPath: resolveAncestorChain(productCategoryNodes, String(product.categoryId)),
      }),
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      compareAtPriceVerified: product.compareAtPriceVerified ?? false,
      thumbnail: product.images?.[0]?.url ?? null,
      averageRating: product.averageRating,
    })),
    recommendedShop: getRecommendedShop(post),
    relatedPosts: related.map((item) => ({
      id: String(item._id),
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      featuredImage: resolveBlogImage(item as any, imageCandidates),
      publishedAt: item.publishedAt?.toISOString() ?? '',
    })),
  }

  const schema = blogStructuredData({ ...detail, description: blogDescription(post) })
  return <>
    <script type="application/ld+json" id="blog-post-schema"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
    <BlogPostPage post={detail} />
  </>
}

function getRecommendedShop(post: { title?: string; tags?: string[] }) {
  const topic = `${post.title || ''} ${(post.tags || []).join(' ')}`.toLowerCase()
  if (topic.includes('bomber')) return { href: '/bomber-jackets', label: 'Bomber jackets' }
  if (topic.includes('coach')) return { href: '/coach-jackets', label: 'Coach jackets' }
  if (topic.includes('denim')) return { href: '/denim-jackets', label: 'Denim jackets' }
  if (topic.includes('puffer')) return { href: '/puffer-jackets', label: 'Puffer jackets' }
  if (topic.includes('hoodie') || topic.includes('fleece')) return { href: '/fleece-hoodies', label: 'Fleece hoodies' }
  if (topic.includes('corporate')) return { href: '/bulk-orders/corporate', label: 'Corporate jacket orders' }
  if (topic.includes('private label') || topic.includes('brand')) return { href: '/bulk-orders/private-label', label: 'Private-label jackets' }
  if (topic.includes('school') || topic.includes('team') || topic.includes('group')) return { href: '/bulk-orders/schools', label: 'School and team jackets' }
  return { href: '/varsity-jackets', label: 'Varsity jackets' }
}
