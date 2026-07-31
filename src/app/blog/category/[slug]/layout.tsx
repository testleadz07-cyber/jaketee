import { cache } from 'react'
import { Metadata } from 'next'
import { connectDB } from '@/lib/mongodb'
import BlogCategory from '@/models/BlogCategory'
import BlogPost from '@/models/BlogPost'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'
const DEFAULT_IMAGE = 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg'

const getCategory = cache(async (slug: string) => {
  try {
    const db = await connectDB()
    if (!db) return null
    return await BlogCategory.findOne({ slug }).lean()
  } catch (error) {
    console.error('Error fetching blog category:', error)
    return null
  }
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category: any = await getCategory(slug)

  if (!category) {
    return {
      title: 'Category Not Found — LUXE STORE Blog',
      description: 'The requested blog category could not be found.',
      robots: { index: false, follow: false },
    }
  }

  const pageUrl = `${SITE_URL}/blog/category/${slug}`
  const title = `${category.name} — LUXE STORE Blog`
  const description = category.description || `Browse ${category.name} articles from the LUXE STORE Journal.`

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'LUXE STORE',
      images: [{ url: DEFAULT_IMAGE, width: 1200, height: 630, alt: category.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_IMAGE],
    },
  }
}

export default async function BlogCategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category: any = await getCategory(slug)

  if (!category) {
    return <>{children}</>
  }

  const pageUrl = `${SITE_URL}/blog/category/${slug}`
  const postCount = await BlogPost.countDocuments({
    categories: category._id,
    status: 'published',
  }).catch(() => 0)

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description || `Browse ${category.name} articles from the LUXE STORE Journal.`,
    url: pageUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: postCount,
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: category.name, item: pageUrl },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  )
}
