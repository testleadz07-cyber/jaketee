import { getPublicBlogCategories, getPublicBlogRows } from '@/lib/public-blog'
import { withSocialMetadata } from '@/lib/seo-metadata'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { metadata as archiveMetadata } from './metadata'
import { STATIC_BLOG_GUIDES, blogPageNumber, blogArchivePath } from '@/lib/blog-archive'
import { connectDB } from '@/lib/mongodb'
import { getBlogImageCandidates, resolveBlogImage } from '@/lib/blog-images'
import BlogListPage, { type BlogCategory as CategorySummary, type BlogPostSummary } from './blog-list-client'

export const revalidate = 300

const PAGE_SIZE = 9

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string; category?: string; tag?: string }> }): Promise<Metadata> {
  const { page, category, tag } = await searchParams
  const url = `https://www.jacketee.com${blogArchivePath(blogPageNumber(page), category, '/blog', tag)}`
  return withSocialMetadata({ ...archiveMetadata, alternates: { canonical: url }, openGraph: { ...archiveMetadata.openGraph, url } })
}

export default async function Page({ searchParams }: {
  searchParams: Promise<{ page?: string; category?: string; tag?: string }>
}) {
  const { page: requestedPage, category: categorySlug, tag } = await searchParams
  const page = blogPageNumber(requestedPage)
  const availableCategories = await getPublicBlogCategories()
  const category = categorySlug ? availableCategories.find(item => item.slug === categorySlug) : null
  if (categorySlug && !category) notFound()
  const [{ posts: databasePosts, total: databaseTotal }, imageCandidates] = await Promise.all([
    getPublicBlogRows({ categoryId: category?._id, tag, all: true }), getBlogImageCandidates(),
  ])
  const rawCategories = availableCategories

  const guides = category || tag ? [] : STATIC_BLOG_GUIDES.filter(guide => !databasePosts.some(post => post.slug === guide.slug))
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
    author: { name: 'Jacketee Team' },
    publishedAt: ('publishedAt' in post && post.publishedAt instanceof Date) ? post.publishedAt.toISOString() : '',
    views: post.views ?? 0,
  }))
  const categories: CategorySummary[] = rawCategories.map((category) => ({
    id: String(category._id),
    name: category.name,
    slug: category.slug,
  }))

  return <BlogListPage posts={posts} categories={categories} categorySlug={categorySlug} tag={tag} page={page} pages={Math.ceil(total / PAGE_SIZE)} total={total} />
}
