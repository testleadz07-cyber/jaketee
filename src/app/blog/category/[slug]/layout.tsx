import { getPublicBlogCategories, getPublicBlogRows } from '@/lib/public-blog'
import { cache } from 'react'
import { connectDB } from '@/lib/mongodb'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'

const getCategory = cache(async (slug: string) => {
  try {
    const db = await connectDB()
    if (!db) return null
    return (await getPublicBlogCategories()).find(item => item.slug === slug) || null
  } catch (error) {
    console.error('Error fetching blog category:', error)
    return null
  }
})

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
  const postCount = await getPublicBlogRows({ categoryId: category._id, page: 1, limit: 9 }).then(result => result.total).catch(() => 0)

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description || `Browse ${category.name} articles from the Jacketee Journal.`,
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }} />
      {children}
    </>
  )
}
