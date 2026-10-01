import { notFound } from 'next/navigation'
import sanitizeHtml from 'sanitize-html'
import { connectDB } from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import BlogCategory from '@/models/BlogCategory'
import Product from '@/models/Product'
import Category from '@/models/Category'
import BlogPostPage, { type BlogPostDetail } from './post-client'
import { getBlogImageCandidates, resolveBlogImage } from '@/lib/blog-images'
import { buildProductUrl, resolveAncestorChain } from '@/lib/categories'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await connectDB())) throw new Error('Blog content is temporarily unavailable')

  const { slug } = await params
  const now = new Date()
  const rawPost = await BlogPost.findOne({
    slug,
    $or: [{ status: 'published' }, { status: 'scheduled', publishedAt: { $lte: now } }],
  }).lean()
  if (!rawPost) notFound()

  const post = rawPost as any
  const categoryIds = post.categories ?? []
  const productIds = post.taggedProducts ?? []
  const [categories, taggedProducts, productCategories, imageCandidates] = await Promise.all([
    categoryIds.length
      ? BlogCategory.find({ _id: { $in: categoryIds } }).select('name slug').lean()
      : [],
    productIds.length
      ? Product.find({ _id: { $in: productIds } })
          .select('name slug categoryId price compareAtPrice compareAtPriceVerified images averageRating')
          .lean()
      : [],
    productIds.length ? Category.find({}).select('name slug parentId').lean() : [],
    getBlogImageCandidates(),
    BlogPost.updateOne({ _id: post._id }, { $inc: { views: 1 } }),
  ])
  const categoriesById = new Map(categories.map((category: any) => [String(category._id), category]))
  const productsById = new Map(taggedProducts.map((product: any) => [String(product._id), product]))
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
  const related = categoryIds.length
    ? await BlogPost.find({
        _id: { $ne: post._id },
        categories: { $in: categoryIds },
        $or: [{ status: 'published' }, { status: 'scheduled', publishedAt: { $lte: now } }],
      })
        .select('title slug excerpt featuredImage publishedAt')
        .sort({ publishedAt: -1 })
        .limit(3)
        .lean()
    : []

  const detail: BlogPostDetail = {
    id: String(post._id),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: sanitizeHtml(post.content || '', {
      allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        a: ['href', 'name', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
    }),
    featuredImage: resolveBlogImage({ ...post, categories: resolvedCategories }, imageCandidates),
    categories: resolvedCategories.map((category: any) => ({
      id: String(category._id), name: category.name, slug: category.slug,
    })),
    tags: post.tags ?? [],
    author: { name: post.author?.name ?? 'Jacketee' },
    publishedAt: post.publishedAt?.toISOString() ?? '',
    updatedAt: post.updatedAt?.toISOString() ?? post.publishedAt?.toISOString() ?? '',
    views: (post.views ?? 0) + 1,
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

  return <BlogPostPage post={detail} />
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
