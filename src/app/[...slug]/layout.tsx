import { Metadata } from 'next'
import { permanentRedirect, notFound } from 'next/navigation'
import { resolveSlugPath } from '@/lib/route-resolver'
import { ProductDetailView } from '@/components/product-detail-view'
import { CategoryDetailView } from '@/components/category-detail-view'
import { connectDB } from '@/lib/mongodb'
import Review from '@/models/Review'

interface Props {
  params: Promise<{ slug: string[] }>
  children: React.ReactNode
}

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'
const DEFAULT_IMAGE = 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg'

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params
  const resolution = await resolveSlugPath(slug)
  const canonicalUrl = `${SITE_URL}/${slug.join('/')}`

  if (resolution.type === 'product') {
    const product = resolution.product
    const title = `${product.name} - Jacketee`
    const description = (product.description || '').slice(0, 160)
    const imageUrl = product.images?.[0]?.url || DEFAULT_IMAGE

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: { title, description, images: [{ url: imageUrl }], type: 'website', url: canonicalUrl },
      twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
    }
  }

  if (resolution.type === 'category') {
    const category = resolution.category
    const title = `${category.name} - Jacketee`
    const description = category.description
      ? category.description.slice(0, 160)
      : `Shop ${category.name} at Jacketee`
    const imageUrl = category.image || DEFAULT_IMAGE

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: { title, description, images: [{ url: imageUrl }], type: 'website', url: canonicalUrl },
      twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
    }
  }

  return {
    title: 'Page Not Found - Jacketee',
    description: 'The requested page could not be found.',
  }
}

// Does the category/product resolution AND renders the resolved view here
// (instead of {children}) - see page.tsx for why. redirect()/notFound() both
// interrupt rendering entirely, so this is the single place that decides
// what the visitor sees for any root-level nested path.
export default async function CatchAllLayout({ params }: Props) {
  const { slug } = await params
  const resolution = await resolveSlugPath(slug)
  const canonicalUrl = `${SITE_URL}/${slug.join('/')}`

  if (resolution.type === 'redirect') {
    permanentRedirect(resolution.to)
  }
  if (resolution.type === 'notfound') {
    notFound()
  }

  if (resolution.type === 'product') {
    const product = resolution.product
    const imageUrls = (product.images?.length ? product.images : [{ url: DEFAULT_IMAGE }]).map(
      (img: any) => img.url
    )
    const price = Number(product.price ?? 0)
    const availability = product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    const categoryPath: { name: string; slug: string }[] = product.categoryPath || []

    const productJsonLd: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: imageUrls,
      sku: String(product._id || product.id || product.slug),
      url: canonicalUrl,
      brand: { '@type': 'Brand', name: 'Jacketee' },
      ...(categoryPath.length > 0 && { category: categoryPath[categoryPath.length - 1].name }),
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: 'USD',
        price: price.toFixed(2),
        availability,
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@type': 'Organization', name: 'Jacketee' },
      },
    }

    if (product.reviewCount && product.reviewCount > 0) {
      productJsonLd.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: Number(product.averageRating || 0).toFixed(1),
        reviewCount: product.reviewCount,
      }

      try {
        const db = await connectDB()
        if (db) {
          const productId = product._id || product.id
          const recentReviews = await Review.find({ productId, status: 'approved' })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()

          if (recentReviews.length > 0) {
            productJsonLd.review = recentReviews.map((r: any) => ({
              '@type': 'Review',
              author: { '@type': 'Person', name: r.userName },
              datePublished: new Date(r.createdAt).toISOString(),
              reviewBody: r.comment,
              reviewRating: {
                '@type': 'Rating',
                ratingValue: r.rating,
                bestRating: 5,
                worstRating: 1,
              },
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching reviews for product JSON-LD:', error)
      }
    }

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        ...categoryPath.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 2,
          name: c.name,
          item: `${SITE_URL}/${categoryPath.slice(0, i + 1).map((x) => x.slug).join('/')}`,
        })),
        {
          '@type': 'ListItem',
          position: categoryPath.length + 2,
          name: product.name,
          item: canonicalUrl,
        },
      ],
    }

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
        <ProductDetailView slug={product.slug} />
      </>
    )
  }

  // category
  const category = resolution.category
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description || `Shop ${category.name} at Jacketee`,
    url: canonicalUrl,
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      ...resolution.ancestorChain.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: a.name,
        item: `${SITE_URL}/${resolution.ancestorChain.slice(0, i + 1).map((x) => x.slug).join('/')}`,
      })),
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <CategoryDetailView slug={category.slug} />
    </>
  )
}
