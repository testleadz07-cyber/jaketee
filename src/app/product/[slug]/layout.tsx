import { Metadata } from 'next'
import { cache } from 'react'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import { findStaticProduct } from '@/lib/static-data'
import mongoose from 'mongoose'

interface Props {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'
const DEFAULT_IMAGE = 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg'

// Cached per-request so generateMetadata and the layout body don't hit the DB twice
const getProductForSeo = cache(async (slug: string) => {
  let product: any = null

  try {
    const db = await connectDB()
    if (db) {
      if (mongoose.Types.ObjectId.isValid(slug)) {
        product = await Product.findById(slug).populate('categoryId', 'name slug').lean()
      }
      if (!product) {
        product = await Product.findOne({ slug: slug }).populate('categoryId', 'name slug').lean()
      }
    }
  } catch (error) {
    console.error('Error fetching product for metadata:', error)
  }

  if (!product) {
    product = findStaticProduct(slug)
  }

  return product
})

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductForSeo(slug)

  if (!product) {
    return {
      title: 'Product Not Found - LUXE STORE',
      description: 'The requested product could not be found.',
    }
  }

  const title = `${product.name} - LUXE STORE`
  const description = product.description.slice(0, 160)
  const imageUrl = product.images?.[0]?.url || DEFAULT_IMAGE
  const canonicalUrl = `${SITE_URL}/product/${product.slug}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl }],
      type: 'website',
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function ProductLayout({ children, params }: Props) {
  const { slug } = await params
  const product = await getProductForSeo(slug)

  if (!product) {
    return <>{children}</>
  }

  const category = product.category || product.categoryId
  const imageUrls = (product.images?.length ? product.images : [{ url: DEFAULT_IMAGE }]).map(
    (img: any) => img.url
  )
  const price = Number(product.price ?? 0)
  const availability = product.inStock
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock'

  const productJsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: imageUrls,
    sku: String(product._id || product.id || product.slug),
    url: `${SITE_URL}/product/${product.slug}`,
    brand: {
      '@type': 'Brand',
      name: 'LUXE STORE',
    },
    ...(category?.name && {
      category: category.name,
    }),
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: 'USD',
      price: price.toFixed(2),
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'LUXE STORE',
      },
    },
  }

  if (product.reviewCount && product.reviewCount > 0) {
    productJsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(product.averageRating || 0).toFixed(1),
      reviewCount: product.reviewCount,
    }
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      ...(category?.name
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: category.name,
              item: `${SITE_URL}/?category=${category.slug}`,
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: category?.name ? 3 : 2,
        name: product.name,
        item: `${SITE_URL}/product/${product.slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  )
}
