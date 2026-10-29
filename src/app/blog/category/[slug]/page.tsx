export const dynamic = 'force-dynamic'

import { getPublicBlogCategories, getPublicBlogRows } from '@/lib/public-blog'
import { withSocialMetadata } from '@/lib/seo-metadata'
import type { Metadata } from 'next'
import { blogPageNumber, blogArchivePath } from '@/lib/blog-archive'
import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import { getBlogImageCandidates, resolveBlogImage } from '@/lib/blog-images'
import BlogCategoryPage, { type BlogPostSummary } from './category-client'

export const revalidate = 300

const PAGE_SIZE = 9

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
  const [{ slug }, { page }] = await Promise.all([params, searchParams])
  const category = (await getPublicBlogCategories()).find(item => item.slug === slug)
  if (!category) return withSocialMetadata({ robots: { index: false, follow: false } })
  const url = `https://www.jacketee.com${blogArchivePath(blogPageNumber(page), undefined, `/blog/category/${slug}`)}`
  const title = `${category.name} | Jacketee Journal`
  const description = category.description || `Browse ${category.name} articles from the Jacketee Journal.`
  return withSocialMetadata({ title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: 'website' } })
}

export default async function Page({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const [{ slug }, { page: requestedPage }] = await Promise.all([params, searchParams])
  const category = (await getPublicBlogCategories()).find(item => item.slug === slug)
  if (!category) notFound()

  const page = blogPageNumber(requestedPage)
  const [{ posts: rawPosts, total }, imageCandidates] = await Promise.all([
    getPublicBlogRows({ categoryId: category._id, page, limit: PAGE_SIZE }), getBlogImageCandidates(),
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
    author: { name: 'Jacketee Team' },
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
