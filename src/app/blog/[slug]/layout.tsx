import { cache } from 'react'
import { Metadata } from 'next'
import { connectDB } from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import { getBlogImageCandidates, resolveBlogImage } from '@/lib/blog-images'
import { BLOG_SITE_URL, blogDescription } from '@/lib/blog-post-seo'

const SITE_URL = BLOG_SITE_URL
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`

const getPost = cache(async (slug: string) => {
  try {
    const db = await connectDB()
    if (!db) return null
    const now = new Date()
    return await BlogPost.findOne({
      slug,
      $or: [{ status: 'published' }, { status: 'scheduled', publishedAt: { $lte: now } }],
    }).lean()
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post: any = await getPost(slug)

  if (!post) {
    return {
      title: 'Post Not Found — Jacketee Blog',
      description: 'The requested blog post could not be found.',
      robots: { index: false, follow: false },
    }
  }

  const pageUrl = `${SITE_URL}/blog/${slug}`
  const title = post.seoTitle || `${post.title} — Jacketee Blog`
  const description = blogDescription(post)
  const imageUrl = post.ogImage || resolveBlogImage(post, await getBlogImageCandidates()) || DEFAULT_IMAGE
  const authorName = post.author?.name || 'Jacketee'
  const publishedTime = post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined
  const modifiedTime = post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'Jacketee',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: post.title }],
      type: 'article',
      publishedTime,
      modifiedTime,
      authors: [authorName],
      tags: post.tags || [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
