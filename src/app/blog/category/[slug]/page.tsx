import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import BlogCategory from '@/models/BlogCategory'
import BlogPost from '@/models/BlogPost'
import BlogCategoryPage, { type BlogPostSummary } from './category-client'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 9

export default async function Page({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  if (!(await connectDB())) throw new Error('Blog content is temporarily unavailable')

  const [{ slug }, { page: requestedPage }] = await Promise.all([params, searchParams])
  const category = await BlogCategory.findOne({ slug }).lean()
  if (!category) notFound()

  const parsedPage = Number(requestedPage)
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const query = {
    categories: category._id,
    $or: [
      { status: 'published' },
      { status: 'scheduled', publishedAt: { $lte: new Date() } },
    ],
  }
  const [total, rawPosts] = await Promise.all([
    BlogPost.countDocuments(query),
    BlogPost.find(query)
      .populate('categories', 'name slug')
      .select('title slug excerpt featuredImage categories author publishedAt')
      .sort({ publishedAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
  ])
  const posts: BlogPostSummary[] = rawPosts.map((post) => ({
    id: String(post._id),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage ?? null,
    categories: (post.categories ?? []).map((item) => ({
      id: String(item._id), name: item.name, slug: item.slug,
    })),
    author: { name: post.author?.name ?? 'Jacketee' },
    publishedAt: post.publishedAt?.toISOString() ?? '',
  }))

  return <BlogCategoryPage
    category={{ id: String(category._id), name: category.name, slug: category.slug, description: category.description }}
    posts={posts} page={page} pages={Math.ceil(total / PAGE_SIZE)} total={total}
  />
}
