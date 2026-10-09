import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { metadata as archiveMetadata } from './metadata'
import { STATIC_BLOG_GUIDES, blogPageNumber, blogArchivePath } from '@/lib/blog-archive'
import { connectDB } from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import BlogCategory from '@/models/BlogCategory'
import { getBlogImageCandidates, resolveBlogImage } from '@/lib/blog-images'
import BlogListPage, { type BlogCategory as CategorySummary, type BlogPostSummary } from './blog-list-client'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 9

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string; category?: string }> }): Promise<Metadata> {
  const { page, category } = await searchParams
  const url = `https://www.jacketee.com${blogArchivePath(blogPageNumber(page), category)}`
  return { ...archiveMetadata, alternates: { canonical: url }, openGraph: { ...archiveMetadata.openGraph, url } }
}

export default async function Page({ searchParams }: {
  searchParams: Promise<{ page?: string; category?: string }>
}) {
  if (!(await connectDB())) {
    throw new Error('Blog content is temporarily unavailable')
  }

  const { page: requestedPage, category: categorySlug } = await searchParams
  const page = blogPageNumber(requestedPage)
  const category = categorySlug ? await BlogCategory.findOne({ slug: categorySlug }).lean() : null
  if (categorySlug && !category) notFound()
  const query = { status: 'published', ...(category ? { categories: category._id } : {}) }

  const [databaseTotal, databasePosts, rawCategories, imageCandidates] = await Promise.all([
    BlogPost.countDocuments(query),
    BlogPost.find(query)
      .populate('categories', 'name slug')
      .select('title slug excerpt featuredImage categories tags taggedProducts author publishedAt views')
      .sort({ publishedAt: -1 })
      .lean(),
    BlogCategory.find().select('name slug').sort({ name: 1 }).lean(),
    getBlogImageCandidates(),
  ])

  const guides = category ? [] : STATIC_BLOG_GUIDES.filter(guide => !databasePosts.some(post => post.slug === guide.slug))
  const total = databaseTotal + guides.length
  if (page > Math.max(1, Math.ceil(total / PAGE_SIZE))) notFound()
  const rawPosts = [...databasePosts, ...guides].slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const posts: BlogPostSummary[] = rawPosts.map((post) => ({
    id: String(post._id),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    featuredImage: resolveBlogImage(post as any, imageCandidates),
    categories: (post.categories ?? []).map((category) => ({
      id: String(category._id),
      name: category.name,
      slug: category.slug,
    })),
    tags: post.tags,
    author: { name: post.author?.name ?? 'Jacketee' },
    publishedAt: ('publishedAt' in post && post.publishedAt instanceof Date) ? post.publishedAt.toISOString() : '',
    views: post.views ?? 0,
  }))
  const categories: CategorySummary[] = rawCategories.map((category) => ({
    id: String(category._id),
    name: category.name,
    slug: category.slug,
  }))

  return <BlogListPage posts={posts} categories={categories} categorySlug={categorySlug} page={page} pages={Math.ceil(total / PAGE_SIZE)} total={total} />
}
