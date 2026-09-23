import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import '@/models/BlogCategory'
import '@/models/Product'
import BlogPostPage, { type BlogPostDetail } from './post-client'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await connectDB())) throw new Error('Blog content is temporarily unavailable')

  const { slug } = await params
  const now = new Date()
  const rawPost = await BlogPost.findOneAndUpdate(
    {
      slug,
      $or: [{ status: 'published' }, { status: 'scheduled', publishedAt: { $lte: now } }],
    },
    { $inc: { views: 1 } },
    { returnDocument: 'after' }
  )
    .populate('categories', 'name slug')
    .populate('taggedProducts', 'name slug price compareAtPrice images averageRating')
    .lean()
  if (!rawPost) notFound()

  const post = rawPost as any
  const categoryIds = (post.categories ?? []).map((category: any) => category._id)
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
    categories: (post.categories ?? []).map((category: any) => ({
      id: String(category._id), name: category.name, slug: category.slug,
    })),
    tags: post.tags ?? [],
    author: { name: post.author?.name ?? 'Jacketee' },
    publishedAt: post.publishedAt?.toISOString() ?? '',
    views: post.views ?? 0,
    taggedProducts: (post.taggedProducts ?? []).map((product: any) => ({
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
