import { cache } from 'react'
import { Metadata } from 'next'
import { connectDB } from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'
const DEFAULT_IMAGE = 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg'

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
  const description = (post.seoDescription || post.excerpt || '').slice(0, 160)
  const imageUrl = post.ogImage || post.featuredImage || DEFAULT_IMAGE
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

export default async function BlogPostLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post: any = await getPost(slug)

  if (!post) {
    return <>{children}</>
  }

  const pageUrl = `${SITE_URL}/blog/${slug}`
  const imageUrl = post.ogImage || post.featuredImage || DEFAULT_IMAGE
  const authorName = post.author?.name || 'Jacketee'

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: imageUrl,
    url: pageUrl,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    author: { '@type': 'Person', name: authorName },
    publisher: {
      '@type': 'Organization',
      name: 'Jacketee',
      logo: { '@type': 'ImageObject', url: DEFAULT_IMAGE },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {children}
    </>
  )
}
