import { getPublicBlogPost } from '@/lib/public-blog'
import { withSocialMetadata } from '@/lib/seo-metadata'
import { Metadata } from 'next'
import { socialImageUrl } from '@/lib/seo-metadata'
import { BLOG_SITE_URL, blogDescription } from '@/lib/blog-post-seo'

const SITE_URL = BLOG_SITE_URL

const getPost = getPublicBlogPost

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post: any = await getPost(slug)

  if (!post) {
    return withSocialMetadata({
      title: 'Post Not Found — Jacketee Blog',
      description: 'The requested blog post could not be found.',
      robots: { index: false, follow: false },
    })
  }

  const pageUrl = `${SITE_URL}/blog/${slug}`
  const title = post.seoTitle || `${post.title} — Jacketee Blog`
  const description = blogDescription(post)
  const imageUrl = socialImageUrl(post.featuredImage)
  const authorName = 'Jacketee Team'
  const publishedTime = post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined
  const modifiedTime = post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined

  return withSocialMetadata({
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
  })
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
