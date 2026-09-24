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
import { buildProductUrl, resolveAncestorChain, resolveDescendantIds } from '@/lib/categories'

interface Props {
  params: Promise<{ slug: string[] }>
  searchParams: Promise<{ page?: string | string[] }>
}

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`
const CATEGORY_PRODUCTS_PER_PAGE = 24

function parsePageParam(page?: string | string[]) {
  const value = Array.isArray(page) ? page[0] : page
  const parsed = Number.parseInt(value || '1', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function categoryCanonicalUrl(slug: string[], page: number) {
  const path = `${SITE_URL}/${slug.join('/')}`
  return page > 1 ? `${path}?page=${page}` : path
}

function faqAnswerText(faq: { answer?: string[]; bullets?: string[]; ordered?: string[] }) {
  return [
    ...(faq.answer || []),
    ...(faq.bullets || []),
    ...(faq.ordered || []),
  ].filter(Boolean).join(' ')
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const requestedPage = parsePageParam(query.page)
  const resolution = await resolveSlugPath(slug)
  const canonicalUrl = resolution.type === 'category'
    ? categoryCanonicalUrl(slug, requestedPage)
    : `${SITE_URL}/${slug.join('/')}`

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
    const pageTitleSuffix = requestedPage > 1 ? ` - Page ${requestedPage}` : ''
    const title = category.seoTitle
      ? `${category.seoTitle}${pageTitleSuffix}`
      : `${category.name}${pageTitleSuffix} - Jacketee`
    const descriptionSource = category.seoDescription || category.description
    const description = descriptionSource
      ? descriptionSource.slice(0, 160)
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

export default async function CatchAllPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const requestedPage = parsePageParam(query.page)
  const resolution = await resolveSlugPath(slug)
  const canonicalUrl = resolution.type === 'category'
    ? categoryCanonicalUrl(slug, requestedPage)
    : `${SITE_URL}/${slug.join('/')}`

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
    let approvedReviewCount = 0
    let approvedAverageRating = 0
    let approvedReviews: any[] = []
    try {
      const db = await connectDB()
      if (db) {
        const productId = product._id || product.id
        const reviewMatch = { productId, status: 'approved' }
        const [matched, reviewSummary, recentReviews] = await Promise.all([
          Faq.find({ displayPages: { $in: faqTargets } }).limit(24).lean(),
          Review.aggregate([
            { $match: reviewMatch },
            { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } },
          ]),
          Review.find(reviewMatch).sort({ createdAt: -1 }).limit(5).lean(),
        ])
        approvedReviewCount = Number(reviewSummary[0]?.count || 0)
        approvedAverageRating = Number(reviewSummary[0]?.average || 0)
        approvedReviews = recentReviews
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
      averageRating: approvedAverageRating,
      reviewCount: approvedReviewCount,
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

    if (approvedReviewCount > 0 && approvedAverageRating > 0) {
      productJsonLd.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: Number(approvedAverageRating.toFixed(1)),
        reviewCount: approvedReviewCount,
      }

      if (approvedReviews.length > 0) {
        productJsonLd.review = approvedReviews.map((review: any) => ({
          '@type': 'Review',
          author: { '@type': 'Person', name: review.userName },
          datePublished: new Date(review.createdAt).toISOString(),
          reviewBody: review.comment,
          reviewRating: {
            '@type': 'Rating',
            ratingValue: review.rating,
            bestRating: 5,
            worstRating: 1,
          },
        }))
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

  const category = resolution.category
  let initialCategories: Array<{ id: string; name: string; slug: string; description?: string; heading?: string; image?: string; parentId: string | null; _count: { products: number } }> = []
  let initialProducts: any[] = []
  let initialTotalProducts = 0
  let initialInsights: { reviewCount: number; averageRating: number; reviews: any[]; faqs: any[] } = {
    reviewCount: 0,
    averageRating: 0,
    reviews: [],
    faqs: [],
  }
  try {
    const db = await connectDB()
    if (db) {
      const rawCategories = await Category.find().lean()
      const nodes = rawCategories.map((item: any) => ({
        _id: String(item._id),
        name: item.name,
        slug: item.slug,
        description: item.description || '',
        heading: item.heading || '',
        parentId: item.parentId ? String(item.parentId) : null,
      }))
      const counts = await Product.aggregate([{ $match: { inStock: true } }, { $group: { _id: '$categoryId', count: { $sum: 1 } } }])
      const countById = new Map<string, number>(counts.map((item: any) => [String(item._id), Number(item.count)]))
      initialCategories = rawCategories.map((item: any) => {
        const id = String(item._id)
        return {
          id,
          name: item.name,
          slug: item.slug,
          description: item.description || '',
          heading: item.heading || '',
          image: item.image || '',
          parentId: item.parentId ? String(item.parentId) : null,
          _count: { products: resolveDescendantIds(nodes, id).reduce((sum, descendantId) => sum + (countById.get(descendantId) || 0), 0) },
        }
      })

      const categoryId = String(category._id)
      const descendantIds = resolveDescendantIds(nodes, categoryId)
      const productFilter = { inStock: true, categoryId: { $in: descendantIds } }
      const [rawProducts, total] = await Promise.all([
        Product.find(productFilter)
          .sort({ isFeatured: -1, createdAt: -1 })
          .skip((requestedPage - 1) * CATEGORY_PRODUCTS_PER_PAGE)
          .limit(CATEGORY_PRODUCTS_PER_PAGE)
          .populate('categoryId', 'name slug')
          .lean(),
        Product.countDocuments(productFilter),
      ])
      initialTotalProducts = total
      initialProducts = rawProducts.map((product: any) => {
        const leafId = String(product.categoryId?._id || product.categoryId)
        const categoryPath = resolveAncestorChain(nodes, leafId).map((item) => ({ name: item.name, slug: item.slug }))
        return {
          id: String(product._id),
          name: product.name,
          slug: product.slug,
          description: product.description || '',
          price: Number(product.price || 0),
          compareAtPrice: product.compareAtPrice == null ? null : Number(product.compareAtPrice),
          images: (product.images || []).map((image: any) => ({
            url: image.url,
            alt: image.alt || '',
          })),
          category: product.categoryId ? { name: product.categoryId.name, slug: product.categoryId.slug } : { name: category.name, slug: category.slug },
          categoryPath,
          isFeatured: Boolean(product.isFeatured),
          inStock: Boolean(product.inStock),
        }
      })

      const chain = resolveAncestorChain(nodes, categoryId)
      const targets = chain.slice().reverse().flatMap((item) => {
        const path = chain.slice(0, chain.indexOf(item) + 1).map((part) => part.slug).join('/')
        return [item.slug, `/${item.slug}`, path, `/${path}`]
      })
      const matchedFaqs = await Faq.find({ displayPages: { $in: targets } }).limit(40).lean()
      const faqs: Array<{ id: string; question: string; answer: string[]; bullets: string[]; ordered: string[]; href?: string }> = matchedFaqs
        .sort((a: any, b: any) => Number(a.order || 0) - Number(b.order || 0))
        .slice(0, 10)
        .map((faq: any) => ({
          id: String(faq._id),
          question: faq.question,
          answer: faq.answer || [],
          bullets: faq.bullets || [],
          ordered: faq.ordered || [],
        }))

      const fallbackFaqs = [
        [`What is included in the ${category.name} collection?`, category.description || `Browse the ${category.name} products shown on this page.`, '#category-products'],
        [`How do I choose a size for ${category.name}?`, 'Use our size guide and check the options on each product page before ordering.', '/size-guide'],
        [`Can I customize ${category.name}?`, 'Customization varies by product. Review its available options or contact our team.', '/contact'],
        [`Which materials and colors are available for ${category.name}?`, 'Compare the available fabrics and colors in our materials guide.', '/materials-colors'],
        [`Can patches or embroidery be added to ${category.name}?`, 'See our patches and embroidery guide for techniques and placement options.', '/patches-embroidery'],
        [`Can I place a bulk order for ${category.name}?`, 'Schools, teams, and organizations can request coordinated bulk-order support.', '/bulk-orders'],
        [`How is shipping calculated for ${category.name}?`, 'Review our shipping information for current delivery charges and timelines.', '/shipping'],
        [`Can I return a customized ${category.name} item?`, 'Custom products have return restrictions, so review the policy before ordering.', '/returns'],
        [`How should I compare products in this collection?`, 'Compare material, fit, price, and customization details on each product page.', '#category-products'],
        [`Who can help with a ${category.name} order?`, 'Contact Jacketee with your size, quantity, material, and customization requirements.', '/contact'],
      ]
      const seenQuestions = new Set(faqs.map((faq) => faq.question.trim().toLowerCase()))
      for (const [question, answer, href] of fallbackFaqs) {
        if (faqs.length >= 10) break
        if (seenQuestions.has(question.toLowerCase())) continue
        seenQuestions.add(question.toLowerCase())
        faqs.push({ id: `guide-${faqs.length}`, question, answer: [answer], bullets: [], ordered: [], href })
      }

      const allCategoryProducts = await Product.find({ categoryId: { $in: descendantIds } }, '_id name slug categoryId').lean()
      const productIds = allCategoryProducts.map((product: any) => product._id)
      let reviews: any[] = []
      let reviewCount = 0
      let averageRating = 0
      if (productIds.length > 0) {
        const reviewMatch = { productId: { $in: productIds }, status: 'approved' }
        const [summary, latestReviews] = await Promise.all([
          Review.aggregate([{ $match: reviewMatch }, { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } }]),
          Review.find(reviewMatch).sort({ createdAt: -1 }).limit(2).lean(),
        ])
        reviewCount = Number(summary[0]?.count || 0)
        averageRating = Number(summary[0]?.average || 0)
        const productById = new Map(allCategoryProducts.map((product: any) => [String(product._id), product]))
        reviews = latestReviews.map((review: any) => {
          const product: any = productById.get(String(review.productId))
          const productPath = product ? resolveAncestorChain(nodes, String(product.categoryId)) : []
          return {
            id: String(review._id),
            rating: Number(review.rating),
            title: review.title || '',
            comment: review.comment,
            userName: review.userName,
            productName: product?.name || category.name,
            productHref: product ? buildProductUrl({ slug: product.slug, categoryPath: productPath }) : '#category-products',
          }
        })
      }
      initialInsights = { faqs, reviewCount, averageRating, reviews }
    } else {
      initialCategories = getStaticCategoriesWithCount().map((item: any) => ({
        id: String(item.id), name: item.name, slug: item.slug, description: item.description || '', heading: item.heading || '', image: item.image || '',
        parentId: item.parentId ? String(item.parentId) : null, _count: item._count,
      }))
    }
  } catch (error) {
    console.error('Error loading category data:', error)
  }
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: requestedPage > 1 ? `${category.name} - Page ${requestedPage}` : category.name,
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
  const visibleFaqs = initialInsights.faqs.slice(0, 10)
  const faqJsonLd = visibleFaqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: visibleFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faqAnswerText(faq),
      },
    })),
  } : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      <CategoryDetailView
        key={`${category.slug}-${requestedPage}`}
        slug={category.slug}
        initialCategories={initialCategories}
        initialProducts={initialProducts}
        initialTotalProducts={initialTotalProducts}
        initialPage={requestedPage}
        pageSize={CATEGORY_PRODUCTS_PER_PAGE}
        initialInsights={initialInsights}
      />
    </>
  )
}
