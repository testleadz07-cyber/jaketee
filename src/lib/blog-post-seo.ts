import { cleanMetaText, pageMetaDescription } from './seo-metadata'

export const BLOG_SITE_URL = 'https://www.jacketee.com'

export function blogHeadline(title: string) {
  const text = cleanMetaText(title)
  if (text.length < 110) return text
  const shortened = text.slice(0, 109)
  const boundary = shortened.lastIndexOf(' ')
  return (boundary > 70 ? shortened.slice(0, boundary) : shortened).trim()
}

export function blogDescription(post: { title: string; seoDescription?: string; excerpt?: string }) {
  return pageMetaDescription(
    post.seoDescription || post.excerpt,
    `Read ${cleanMetaText(post.title)} on the Jacketee blog for practical guidance on custom jackets, materials, fit and ordering.`
  )
}

export function blogBreadcrumbs(post: { title: string; slug: string; categories: Array<{ name: string; slug: string }> }) {
  const category = post.categories.find(item => item.name?.trim() && item.slug?.trim())
  return [
    { label: 'Blog', href: '/blog' },
    ...(category ? [{ label: category.name, href: `/blog/category/${category.slug}` }] : []),
    { label: post.title, href: `/blog/${post.slug}` },
  ]
}

export function blogStructuredData(post: {
  title: string; slug: string; description: string; featuredImage?: string | null
  publishedAt: string; updatedAt: string; categories: Array<{ name: string; slug: string }>
}) {
  const canonical = `${BLOG_SITE_URL}/blog/${post.slug}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${canonical}#article`,
        headline: post.title,
        description: post.description,
        image: new URL(post.featuredImage || '/logo.png', BLOG_SITE_URL).href,
        datePublished: post.publishedAt || undefined,
        dateModified: post.updatedAt || post.publishedAt || undefined,
        author: { '@type': 'Organization', name: 'Jacketee Team', url: BLOG_SITE_URL },
        publisher: { '@id': `${(process.env.NEXT_PUBLIC_APP_URL || BLOG_SITE_URL).replace(/\/$/, '')}/#organization` },
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [{ label: 'Home', href: '/' }, ...blogBreadcrumbs(post)].map((item, index) => ({
          '@type': 'ListItem', position: index + 1, name: item.label,
          item: new URL(item.href, BLOG_SITE_URL).href,
        })),
      },
    ],
  }
}
