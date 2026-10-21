'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, BadgeCheck, Headphones, Palette, PackageCheck, Ruler, Sparkles, Truck, RotateCcw, Star } from 'lucide-react'
import Image from '@/components/optimized-image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { ProductCard } from '@/components/product-card'
import { productGridClassName } from '@/lib/product-grid'
import dynamic from 'next/dynamic'
const RecentlyViewed = dynamic(() => import('@/components/RecentlyViewed').then((mod) => mod.RecentlyViewed))
import { HomeDesignCta } from '@/components/home-design-cta'
import { CustomOptionsSection } from '@/components/custom-options-section'
import { Footer } from '@/components/footer'
import { buildCategoryUrl } from '@/lib/categories'
import { curatedCategorySlugs } from '@/lib/curated-category-slugs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice?: number | null
  compareAtPriceVerified?: boolean
  images: Array<{ url: string; alt: string }>
  category?: {
    name: string
    slug: string
  }
  categoryPath?: Array<{ name: string; slug: string }>
  isFeatured: boolean
  inStock: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string | null
  _count: {
    products: number
  }
}

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featuredImage?: string | null
}

interface ReviewHighlight {
  id: string
  name: string
  rating: number
  comment: string
  image: string | null
  productName: string
  productHref: string
}



const trustItems = [
  { icon: BadgeCheck, label: 'Custom design support' },
  { icon: Palette, label: 'Material and color guidance' },
  { icon: PackageCheck, label: 'Secure checkout' },
  { icon: Headphones, label: 'Help within 24 hours' },
]

const homeFaqs = [
  {
    question: 'How do I find the right jacket size?',
    answer: 'If you are unsure about fit, contact our team with your measurements before ordering. We can help you compare the available jacket options.',
    href: '/contact',
    link: 'Ask about sizing',
  },
  {
    question: 'Can I add patches or embroidery?',
    answer: 'Yes. Explore the available patch and embroidery options, then share your artwork and preferred placement with our team.',
    href: '/patches-embroidery',
    link: 'Explore custom options',
  },
  {
    question: 'How do school or bulk orders work?',
    answer: 'Start with the school, corporate, or private-label order page. Tell us the quantity, design, and timing you have in mind so we can discuss the next steps.',
    href: '/bulk-orders',
    link: 'Explore bulk orders',
  },
]

const featuredArticleSlugs = [
  'hooded-varsity-jackets-guide',
  'corporate-away-day-uniforms-custom-jacket-vs-polo',
  'sports-teams-custom-jackets-award-nights-banquets',
]

const homeFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: homeFaqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export default function Home({ categories, featuredProducts, newArrivals, categoryProducts, hero, customDesign }: {
  hero: React.ReactNode
  customDesign: React.ReactNode
  categories: Category[]
  featuredProducts: Product[]
  newArrivals: Product[]
  categoryProducts: Record<string, Product[]>
}) {
  const [articles, setArticles] = useState<BlogPost[]>([])
  const [reviewHighlights, setReviewHighlights] = useState<ReviewHighlight[]>([])
  const loading = false

  useEffect(() => {
    const loadEditorialContent = async () => {
      const [blogResult, reviewResult] = await Promise.allSettled([
        fetch('/api/blog?limit=24').then((res) => res.ok ? res.json() : { posts: [] }),
        fetch('/api/reviews/highlights').then((res) => res.ok ? res.json() : []),
      ])

      if (blogResult.status === 'fulfilled' && Array.isArray(blogResult.value.posts)) {
        const publishedPosts = blogResult.value.posts as BlogPost[]
        const usablePosts = publishedPosts.filter((post) => /^https:\/\//.test(post.featuredImage || ''))
        const selectedPosts = featuredArticleSlugs
          .map((slug) => usablePosts.find((post) => post.slug === slug))
          .filter((post): post is BlogPost => Boolean(post))
        setArticles([
          ...selectedPosts,
          ...usablePosts.filter((post) => !selectedPosts.some((selected) => selected.id === post.id)),
        ].slice(0, 3))
      }

      if (reviewResult.status === 'fulfilled' && Array.isArray(reviewResult.value)) {
        setReviewHighlights(reviewResult.value)
      }
    }

    loadEditorialContent()
  }, [])

  const categoryTiles = curatedCategorySlugs
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category): category is Category => Boolean(category && category._count.products > 0))

  const productGrid = (products: Product[], skeletonCount = 4) => {
    if (loading) {
      return (
        <div className={productGridClassName}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <div key={index} className="aspect-[3/4] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )
    }

    if (products.length === 0) {
      return (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Products are being prepared for this section.
        </div>
      )
    }

    return (
      <div className={productGridClassName}>
        {products.map((product) => (
          <div key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqJsonLd) }}
      />
      <Header />

      {hero}

      <section className="border-b bg-muted/30">
        <div className="container mx-auto grid gap-4 px-4 py-5 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-sm font-medium">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-primary">
                <item.icon className="h-4 w-4" />
              </span>
              {item.label}
            </div>
          ))}
        </div>
      </section>

      <main className="flex-1">
        <section className="store-section store-section--plain" aria-labelledby="jacket-types-heading">
          <div className="section-shell">
            <div className="mb-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Shop by category</p>
              <h2 id="jacket-types-heading" className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Start with the jacket style</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Explore varsity, bomber, leather, and other jacket styles to find the right starting point.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-6">
              {categoryTiles.map((category) => {
                const sampleProduct = categoryProducts[category.slug]?.find((product) => product.images?.some((image) => image.url))
                const productImage = sampleProduct?.images.find((image) => image.url)
                const imageUrl = category.image || productImage?.url

                return (
                  <Link
                    key={category.id}
                    href={buildCategoryUrl([{ slug: category.slug }])}
                    className="group relative isolate aspect-[3/4] overflow-hidden rounded-xl bg-zinc-100 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                  >
                    {imageUrl && (
                      <Image
                        src={imageUrl}
                        alt={category.image ? category.name : productImage?.alt || category.name}
                        fill
                        sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 17vw"
                        quality={80}
                        className="object-contain transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
                    <h3 className="absolute inset-x-0 bottom-0 px-2 pb-4 pt-8 text-center text-base font-bold leading-snug text-white drop-shadow-sm xl:text-lg">
                      {category.name}
                    </h3>
                  </Link>
                )
              })}
            </div>
            <div className="mt-6 text-center">
              <Button asChild variant="outline">
                <Link href="/shop">View All Products</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="store-section store-section--soft">
          <div className="section-shell">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">Featured jackets</p>
                <h2 className="mt-2 text-3xl font-bold md:text-4xl">Selected styles worth seeing first</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Compare a few in-stock jackets and explore the colors, materials, and details that suit you.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/shop?sort=featured">Shop Featured</Link>
              </Button>
            </div>
            {productGrid(featuredProducts)}
          </div>
        </section>

        {customDesign}

        <section className="store-section store-section--contrast" aria-labelledby="bulk-orders-heading">
          <div className="section-shell">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-white/65">Made for your group</p>
              <h2 id="bulk-orders-heading" className="mt-2 text-3xl font-bold md:text-4xl">Custom jackets for schools, teams &amp; brands</h2>
              <p className="mt-4 text-sm leading-7 text-white/75 md:text-base">
                Coordinate school groups, company events, and private-label collections with Jacketee. Plan your materials, brand colors, logo artwork, and individual names or numbers in one order. Share your quantity, size breakdown, and delivery needs, then review your quote and digital proof before production.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-red-700 text-white hover:bg-red-800">
                  <Link href="/bulk-orders#bulk-quote">Request a Free Bulk Quote <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Link href="/bulk-orders" className="text-sm font-semibold underline decoration-white/40 underline-offset-4 hover:decoration-white">How bulk orders work</Link>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/65">
                Planning 10 or more jackets? Start with our <Link href="/materials-colors" className="text-white underline underline-offset-4">materials &amp; colors</Link> and <Link href="/size-guide" className="text-white underline underline-offset-4">size guide</Link> to prepare your brief.
              </p>
            </div>
            <nav aria-label="Bulk jacket programs" className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { title: 'Schools & teams', description: 'Class jackets, clubs, alumni, and player names and numbers.', href: '/bulk-orders/schools' },
                { title: 'Corporate apparel', description: 'Company logos for staff, conferences, events, and employee gifts.', href: '/bulk-orders/corporate' },
                { title: 'Private label', description: 'Plan labels, trims, packaging, samples, and repeat orders.', href: '/bulk-orders/private-label' },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="group border-t border-white/25 pt-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                  <span className="flex items-center justify-between gap-3 text-base font-semibold">{item.title}<ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" /></span>
                  <span className="mt-2 block text-sm leading-6 text-white/65">{item.description}</span>
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <CustomOptionsSection />

        {(loading || newArrivals.length > 0) && <section className="store-section store-section--soft">
          <div className="section-shell">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">New arrivals</p>
                <h2 className="mt-2 text-3xl font-bold md:text-4xl">Fresh styles in the lineup</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  See the newest in-stock jackets added to the Jacketee catalog.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/shop">Browse Catalog</Link>
              </Button>
            </div>
            {productGrid(newArrivals)}
          </div>
        </section>}

        <section className="store-section store-section--plain store-section--accent">
          <div className="section-shell">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Before you order</p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">Shop with confidence</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Check sizing guidance, shipping details, and returns information before placing an order.
          </p>
          <div className="mt-8 grid gap-7 sm:grid-cols-3">
            {[
              { icon: Ruler, title: 'Fit & sizing', href: '/faq', label: 'See sizing answers' },
              { icon: Truck, title: 'Shipping', href: '/shipping', label: 'View shipping information' },
              { icon: RotateCcw, title: 'Returns', href: '/returns', label: 'Read the returns policy' },
            ].map((item) => (
              <div key={item.href} className="border-l-2 border-zinc-300 pl-5 dark:border-zinc-600">
                <item.icon className="h-6 w-6 text-foreground" />
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <Link href={item.href} className="mt-2 inline-flex items-center text-sm text-muted-foreground underline-offset-4 hover:underline">
                  {item.label}<ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
          </div>
        </section>

        {reviewHighlights.length > 0 && (
          <section className="store-section store-section--contrast">
            <div className="section-shell">
              <h2 className="text-2xl font-bold md:text-3xl">From Jacketee customers</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                Read approved reviews from people who ordered Jacketee products.
              </p>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {reviewHighlights.map((review) => (
                  <Link key={review.id} href={review.productHref} className="group block border-t border-white/25 pt-5">
                    {review.image && (
                      <div className="relative mb-5 aspect-[4/3] overflow-hidden bg-muted">
                        <Image src={review.image} alt={`Customer photo of ${review.productName}`} fill sizes="(max-width: 768px) 100vw, 33vw" quality={70} className="object-cover" />
                      </div>
                    )}
                    <div className="flex gap-0.5 text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: review.rating }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
                    </div>
                    <p className="mt-3 line-clamp-4 text-sm leading-6">{review.comment}</p>
                    <p className="mt-4 text-sm font-semibold">{review.name}</p>
                    <p className="mt-1 text-xs text-white/65 group-hover:underline">{review.productName}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="store-section store-section--soft store-section--accent">
          <div className="section-shell grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Help & support</p>
              <h2 className="mt-2 text-2xl font-bold md:text-3xl">Common questions</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                Find quick answers about jacket sizing, custom details, and group orders.
              </p>
              <Link href="/faq" className="mt-5 inline-flex items-center text-sm font-semibold hover:underline">
                View all FAQs <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          <Accordion type="single" collapsible className="border-t border-border">
            {homeFaqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="text-left text-base font-semibold">{faq.question}</AccordionTrigger>
                <AccordionContent className="max-w-3xl text-sm leading-7 text-muted-foreground">
                  <p>{faq.answer}</p>
                  <Link href={faq.href} className="mt-2 inline-flex items-center font-semibold text-foreground hover:underline">
                    {faq.link} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          </div>
        </section>

        {articles.length > 0 && (
          <section className="store-section store-section--plain">
            <div className="section-shell">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase text-primary">Jacketee Journal</p>
                  <h2 className="mt-2 text-2xl font-bold md:text-3xl">Ideas for your next jacket</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Browse practical guides to jacket styles, custom details, and team apparel.
                  </p>
                </div>
                <Link href="/blog" className="inline-flex items-center text-sm font-semibold hover:underline">
                  View all articles <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {articles.map((article) => (
                  <Link key={article.id} href={`/blog/${article.slug}`} className="interactive-lift group block rounded-md border bg-card p-3">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted">
                      <Image src={article.featuredImage!} alt={article.title} fill sizes="(max-width: 768px) 100vw, 33vw" quality={70} className="media-zoom object-cover" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold leading-snug group-hover:underline">{article.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{article.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <RecentlyViewed limit={4} sectionClassName="store-section store-section--soft" />

      <HomeDesignCta />

      <Footer />
    </div>
  )
}
