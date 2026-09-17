import { Metadata } from 'next'
import { permanentRedirect, notFound } from 'next/navigation'
import { resolveSlugPath } from '@/lib/route-resolver'
import { ProductDetailView, type ProductDetailData, type ProductFaqData } from '@/components/product-detail-view'
import { CategoryDetailView } from '@/components/category-detail-view'
import { connectDB } from '@/lib/mongodb'
import Review from '@/models/Review'
import Faq from '@/models/Faq'
import Category from '@/models/Category'
import Product from '@/models/Product'
import { getStaticCategoriesWithCount } from '@/lib/static-data'
import { resolveDescendantIds } from '@/lib/categories'

interface Props {
  params: Promise<{ slug: string[] }>
  children: React.ReactNode
}

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params
  const resolution = await resolveSlugPath(slug)
  const canonicalUrl = `${SITE_URL}/${slug.join('/')}`

  if (resolution.type === 'product') {
    const product = resolution.product
    const title = `${product.name} - Jacketee`
    const description = (product.description || '').slice(0, 160)
    const imageUrl = product.images?.[0]?.url

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: { title, description, ...(imageUrl ? { images: [{ url: imageUrl }] } : {}), type: 'website', url: canonicalUrl },
      twitter: { card: 'summary_large_image', title, description, ...(imageUrl ? { images: [imageUrl] } : {}) },
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
    const categoryPath: { name: string; slug: string }[] = product.categoryPath || []
    const faqTargets = [
      product.slug,
      `/${product.slug}`,
      slug.join('/'),
      `/${slug.join('/')}`,
      ...categoryPath.flatMap((category, index) => {
        const path = categoryPath.slice(0, index + 1).map((item) => item.slug).join('/')
        return [category.slug, `/${category.slug}`, path, `/${path}`]
      }).reverse(),
    ]
    let productFaqs: ProductFaqData[] = []
    try {
      const db = await connectDB()
      if (db) {
        const matched = await Faq.find({ displayPages: { $in: faqTargets } }).limit(24).lean()
        productFaqs = matched
          .sort((a: any, b: any) => {
            const rank = (faq: any) => Math.min(...(faq.displayPages || []).map((page: string) => {
              const index = faqTargets.indexOf(page)
              return index < 0 ? Number.MAX_SAFE_INTEGER : index
            }))
            return rank(a) - rank(b) || Number(a.order || 0) - Number(b.order || 0)
          })
          .slice(0, 4)
          .map((faq: any) => ({
            id: String(faq._id),
            question: faq.question,
            answer: faq.answer || [],
            bullets: faq.bullets || [],
            ordered: faq.ordered || [],
          }))
      }
    } catch (error) {
      console.error('Error fetching product FAQs:', error)
    }
    const initialProduct: ProductDetailData = {
      id: String(product._id || product.id),
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      specificationDetails: product.specificationDetails || undefined,
      careInstructions: product.careInstructions || undefined,
      price: Number(product.price || 0),
      compareAtPrice: product.compareAtPrice == null ? null : Number(product.compareAtPrice),
      inStock: Boolean(product.inStock),
      isFeatured: Boolean(product.isFeatured),
      category: categoryPath.at(-1) || { name: product.categoryId?.name || 'Shop', slug: product.categoryId?.slug || 'shop' },
      categoryPath,
      images: (product.images || []).map((image: any, index: number) => ({
        id: String(image.id || image._id || index),
        url: image.url,
        alt: image.alt || null,
        order: Number(image.order ?? index),
      })),
      variants: (product.variants || []).map((variant: any, index: number) => ({
        id: String(variant.id || variant._id || index),
        name: variant.name,
        value: variant.value,
        priceAdjust: Number(variant.priceAdjust || 0),
        inStock: Boolean(variant.inStock),
        image: variant.image || null,
      })),
      embroidery: product.embroidery ? {
        available: Boolean(product.embroidery.available),
        fee: Number(product.embroidery.fee || 0),
        maxChars: Number(product.embroidery.maxChars || 20),
      } : undefined,
      measurementFields: product.measurementFields || [],
      averageRating: Number(product.averageRating || 0),
      reviewCount: Number(product.reviewCount || 0),
      stockCount: Number(product.stockCount || 0),
    }
    const defaultAdjustments = new Map<string, number>()
    for (const variant of initialProduct.variants) {
      if (variant.inStock && !defaultAdjustments.has(variant.name)) {
        defaultAdjustments.set(variant.name, variant.priceAdjust)
      }
    }
    const price = initialProduct.price + [...defaultAdjustments.values()].reduce((sum, adjustment) => sum + adjustment, 0)
    const availability = product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'

    const productJsonLd: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      ...(initialProduct.images.length > 0 && { image: initialProduct.images.map((img) => img.url) }),
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

    if (initialProduct.reviewCount && initialProduct.reviewCount > 0 && initialProduct.averageRating && initialProduct.averageRating > 0) {
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
        <ProductDetailView key={product.slug} slug={product.slug} initialProduct={initialProduct} faqs={productFaqs} />
      </>
    )
  }

  // category
  const category = resolution.category
  let initialCategories: Array<{ id: string; name: string; slug: string; description?: string; image?: string; parentId: string | null; _count: { products: number } }> = []
  try {
    const db = await connectDB()
    if (db) {
      const rawCategories = await Category.find().lean()
      const nodes = rawCategories.map((item: any) => ({ _id: String(item._id), parentId: item.parentId ? String(item.parentId) : null }))
      const counts = await Product.aggregate([{ $match: { inStock: true } }, { $group: { _id: '$categoryId', count: { $sum: 1 } } }])
      const countById = new Map<string, number>(counts.map((item: any) => [String(item._id), Number(item.count)]))
      initialCategories = rawCategories.map((item: any) => {
        const id = String(item._id)
        return {
          id,
          name: item.name,
          slug: item.slug,
          description: item.description || '',
          image: item.image || '',
          parentId: item.parentId ? String(item.parentId) : null,
          _count: { products: resolveDescendantIds(nodes, id).reduce((sum, descendantId) => sum + (countById.get(descendantId) || 0), 0) },
        }
      })
    } else {
      initialCategories = getStaticCategoriesWithCount().map((item: any) => ({
        id: String(item.id), name: item.name, slug: item.slug, description: item.description || '', image: item.image || '',
        parentId: item.parentId ? String(item.parentId) : null, _count: item._count,
      }))
    }
  } catch (error) {
    console.error('Error loading category data:', error)
  }
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
      <CategoryDetailView key={category.slug} slug={category.slug} initialCategories={initialCategories} />
    </>
  )
}
