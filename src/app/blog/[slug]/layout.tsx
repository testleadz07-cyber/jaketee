import { Metadata } from 'next'
import { connectDB } from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  let post: any = null

  try {
    const db = await connectDB()
    if (db) {
      const now = new Date()
      post = await BlogPost.findOne({
        slug,
        $or: [{ status: 'published' }, { status: 'scheduled', publishedAt: { $lte: now } }],
      }).lean()
    }
  } catch (error) {
    console.error('Error fetching blog post for metadata:', error)
  }

  if (!post) {
    return {
      title: 'Post Not Found - LUXE STORE',
      description: 'The requested blog post could not be found.',
    }
  }

  const title = post.seoTitle || `${post.title} - LUXE STORE`
  const description = (post.seoDescription || post.excerpt || '').slice(0, 160)
  const imageUrl = post.ogImage || post.featuredImage || 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl }],
      type: 'article',
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
