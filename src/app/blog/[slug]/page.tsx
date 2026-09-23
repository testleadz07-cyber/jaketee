import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import BlogCategory from '@/models/BlogCategory'
import Product from '@/models/Product'
import BlogPostPage, { type BlogPostDetail } from './post-client'

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
  const [categories, taggedProducts] = await Promise.all([
    categoryIds.length
      ? BlogCategory.find({ _id: { $in: categoryIds } }).select('name slug').lean()
      : [],
    productIds.length
      ? Product.find({ _id: { $in: productIds } })
          .select('name slug price compareAtPrice images averageRating')
          .lean()
      : [],
    BlogPost.updateOne({ _id: post._id }, { $inc: { views: 1 } }),
  ])
  const categoriesById = new Map(categories.map((category: any) => [String(category._id), category]))
  const productsById = new Map(taggedProducts.map((product: any) => [String(product._id), product]))
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
    content: post.content,
    featuredImage: post.featuredImage ?? null,
    categories: resolvedCategories.map((category: any) => ({
      id: String(category._id), name: category.name, slug: category.slug,
    })),
    tags: post.tags ?? [],
    author: { name: post.author?.name ?? 'Jacketee' },
    publishedAt: post.publishedAt?.toISOString() ?? '',
    views: (post.views ?? 0) + 1,
    taggedProducts: resolvedProducts.map((product: any) => ({
      id: String(product._id),
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      thumbnail: product.images?.[0]?.url ?? null,
      averageRating: product.averageRating,
    })),
    relatedPosts: related.map((item) => ({
      id: String(item._id),
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      featuredImage: item.featuredImage ?? null,
      publishedAt: item.publishedAt?.toISOString() ?? '',
    })),
  }

  return <BlogPostPage post={detail} />
}
