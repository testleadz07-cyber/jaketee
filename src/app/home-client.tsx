'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, BadgeCheck, Headphones, Palette, PackageCheck, Ruler, Sparkles, Truck, RotateCcw, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { ProductCard } from '@/components/product-card'
import { RecentlyViewed } from '@/components/RecentlyViewed'
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

const homeHeroImage = 'https://res.cloudinary.com/dhdfbl8pc/image/upload/v1788899943/clothaa/exports/patches-embroidery/hero__varsity-jacket-patches-embroidery-hero.jpg'

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

export default function Home({ categories, featuredProducts, newArrivals, categoryProducts }: {
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

      <section className="relative min-h-[560px] overflow-hidden bg-zinc-950 text-white md:min-h-[680px]">
        <Image
          src={homeHeroImage}
          alt="Model wearing a blue varsity jacket with custom patches and embroidery"
          fill
          priority
          fetchPriority="high"
          quality={75}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="container relative mx-auto flex min-h-[560px] items-center px-4 py-16 md:min-h-[680px]">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Custom jackets, patches, and embroidery
            </div>
            <h1 className="text-4xl font-black leading-tight md:text-6xl lg:text-7xl">
              Custom Varsity Jackets, Designed Your Way
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/85 md:text-xl">
              Shop varsity, bomber, wool, satin, leather, patch, and embroidery-ready styles built for teams,
              brands, schools, and everyday wear.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link href="/shop">
                  Shop Jackets
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-12 border border-white/20 bg-white/10 px-6 text-base text-white hover:bg-white/20"
              >
                <Link href="/patches-embroidery">Explore Custom Options</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

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
        <section className="store-section store-section--plain store-section--accent">
          <div className="section-shell">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Shop by category</p>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">Start with the jacket style</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Explore varsity, bomber, leather, and other jacket styles to find the right starting point.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/shop">View All Products</Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryTiles.map((category) => {
              const sampleProduct = categoryProducts[category.slug]?.find((product) => product.images?.[0]?.url)
              const imageUrl = sampleProduct?.images?.[0]?.url || category.image

              return (
                <Link
                  key={category.id}
                  href={buildCategoryUrl([{ slug: category.slug }])}
                  className="interactive-lift group relative min-h-[220px] overflow-hidden rounded-lg border border-white/10 bg-zinc-900 p-6 text-white"
                >
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={sampleProduct?.images?.[0]?.alt || category.name}
                      fill
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                      quality={65}
                      className="media-zoom object-cover opacity-50"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="relative flex h-full flex-col justify-end">
                    <p className="text-sm text-white/75">{category._count.products} products</p>
                    <h3 className="mt-2 text-2xl font-bold">{category.name}</h3>
                    <p className="mt-3 flex items-center text-sm font-semibold">
                      Shop category
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </p>
                  </div>
                </Link>
              )
            })}
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

        <section className="store-section store-section--contrast">
          <div className="section-shell">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-white/65">Made for your group</p>
                <h2 className="mt-2 text-3xl font-bold md:text-4xl">Custom & bulk jackets</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
                  Explore jacket options for schools, businesses, and independent labels.
                </p>
              </div>
              <Button asChild variant="secondary">
                <Link href="/bulk-orders">Explore Bulk Orders <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { title: 'Schools & teams', href: '/bulk-orders/schools' },
                { title: 'Corporate apparel', href: '/bulk-orders/corporate' },
                { title: 'Private label', href: '/bulk-orders/private-label' },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="group flex items-center justify-between border-t border-white/25 py-5 text-lg font-semibold transition-colors hover:text-white/70 md:border-y">
                  {item.title}<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="store-section store-section--plain store-section--accent">
          <div className="section-shell">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase text-muted-foreground">Make it yours</p>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">Explore custom options</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Compare jacket materials, then plan the patches and embroidery that make the design your own.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Link
              href="/materials-colors"
              className="interactive-lift group rounded-lg border bg-card p-6 hover:border-primary/50 md:p-8"
            >
              <Palette className="h-8 w-8 text-primary" />
              <h2 className="mt-5 text-2xl font-bold">Materials & Colors</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Compare wool, leather, satin, fleece, twill, and color options before choosing your custom jacket.
              </p>
              <span className="mt-6 inline-flex items-center text-sm font-semibold text-primary">
                Explore guide
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link
              href="/patches-embroidery"
              className="interactive-lift group rounded-lg border bg-card p-6 hover:border-primary/50 md:p-8"
            >
              <Ruler className="h-8 w-8 text-primary" />
              <h2 className="mt-5 text-2xl font-bold">Patches & Embroidery</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Plan chenille patches, embroidery placement, lettering, artwork, and team personalization.
              </p>
              <span className="mt-6 inline-flex items-center text-sm font-semibold text-primary">
                View options
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
          </div>
        </section>

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

      <Footer />
    </div>
  )
}
