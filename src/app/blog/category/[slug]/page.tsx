import type { Metadata } from 'next'
import { blogPageNumber, blogArchivePath } from '@/lib/blog-archive'
import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import BlogCategory from '@/models/BlogCategory'
import BlogPost from '@/models/BlogPost'
import { getBlogImageCandidates, resolveBlogImage } from '@/lib/blog-images'
import BlogCategoryPage, { type BlogPostSummary } from './category-client'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 9

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
  const [{ slug }, { page }] = await Promise.all([params, searchParams])
  if (!(await connectDB())) return {}
  const category = await BlogCategory.findOne({ slug }).lean()
  if (!category) return { robots: { index: false, follow: false } }
  const url = `https://www.jacketee.com${blogArchivePath(blogPageNumber(page), undefined, `/blog/category/${slug}`)}`
  const title = `${category.name} | Jacketee Journal`
  const description = category.description || `Browse ${category.name} articles from the Jacketee Journal.`
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: 'website' } }
}

export default async function Page({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  if (!(await connectDB())) throw new Error('Blog content is temporarily unavailable')

  const [{ slug }, { page: requestedPage }] = await Promise.all([params, searchParams])
  const category = await BlogCategory.findOne({ slug }).lean()
  if (!category) notFound()

  const page = blogPageNumber(requestedPage)
  const query = { categories: category._id, status: 'published' }
  const [total, rawPosts, imageCandidates] = await Promise.all([
    BlogPost.countDocuments(query),
    BlogPost.find(query)
      .populate('categories', 'name slug')
      .select('title slug excerpt featuredImage categories taggedProducts author publishedAt')
      .sort({ publishedAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    getBlogImageCandidates(),
  ])
  if (page > Math.max(1, Math.ceil(total / PAGE_SIZE))) notFound()
  const posts: BlogPostSummary[] = rawPosts.map((post) => ({
    id: String(post._id),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    featuredImage: resolveBlogImage(post as any, imageCandidates),
    categories: (post.categories ?? []).map((item) => ({
      id: String(item._id), name: item.name, slug: item.slug,
    })),
    author: { name: post.author?.name ?? 'Jacketee' },
    publishedAt: post.publishedAt?.toISOString() ?? '',
  }))

  return <BlogCategoryPage
    category={{
      id: String(category._id),
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
    }}
    posts={posts} page={page} pages={Math.ceil(total / PAGE_SIZE)} total={total}
  />
}
