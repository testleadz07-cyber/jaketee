import { connectDB } from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import BlogCategory from '@/models/BlogCategory'
import BlogListPage, { type BlogCategory as CategorySummary, type BlogPostSummary } from './blog-list-client'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 9

export default async function Page({ searchParams }: {
  searchParams: Promise<{ page?: string }>
}) {
  if (!(await connectDB())) {
    throw new Error('Blog content is temporarily unavailable')
  }

  const { page: requestedPage } = await searchParams
  const parsedPage = Number(requestedPage)
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const now = new Date()
  const query = {
    $or: [
      { status: 'published' },
      { status: 'scheduled', publishedAt: { $lte: now } },
    ],
  }

  const [total, rawPosts, rawCategories] = await Promise.all([
    BlogPost.countDocuments(query),
    BlogPost.find(query)
      .populate('categories', 'name slug')
      .select('title slug excerpt featuredImage categories tags author publishedAt views')
      .sort({ publishedAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    BlogCategory.find().select('name slug').sort({ name: 1 }).lean(),
  ])

  const posts: BlogPostSummary[] = rawPosts.map((post) => ({
    id: String(post._id),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage ?? null,
    categories: (post.categories ?? []).map((category) => ({
      id: String(category._id),
      name: category.name,
      slug: category.slug,
    })),
    tags: post.tags,
    author: { name: post.author?.name ?? 'Jacketee' },
    publishedAt: post.publishedAt?.toISOString() ?? '',
    views: post.views ?? 0,
  }))
  const categories: CategorySummary[] = rawCategories.map((category) => ({
    id: String(category._id),
    name: category.name,
    slug: category.slug,
  }))

  return <BlogListPage posts={posts} categories={categories} page={page} pages={Math.ceil(total / PAGE_SIZE)} total={total} />
}
