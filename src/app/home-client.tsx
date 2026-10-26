'use client'

import { BlogCard } from '@/components/blog-card'
import { useEffect, useState } from 'react'
import { ArrowRight, BadgeCheck, Headphones, Palette, PackageCheck, Star } from 'lucide-react'
import Image from '@/components/optimized-image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HomeGroupOrders } from '@/components/home-group-orders'
import { ProductCard } from '@/components/product-card'
import { productGridClassName } from '@/lib/product-grid'
import dynamic from 'next/dynamic'
const RecentlyViewed = dynamic(() => import('@/components/RecentlyViewed').then((mod) => mod.RecentlyViewed))
import { CustomOptionsSection } from '@/components/custom-options-section'
import { WhatsAppButton } from '@/components/whatsapp-help'
import { Footer } from '@/components/footer'
import { buildCategoryUrl } from '@/lib/categories'
import { curatedCategorySlugs } from '@/lib/curated-category-slugs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  featuredCategory?: { name: string; slug: string }
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
    href: '/size-guide',
    link: 'View size guide',
  },
  { question: 'What should I know about delivery?', answer: 'Delivery timing depends on your jacket and customization. Check our shipping information and confirm your required date before ordering.', href: '/shipping', link: 'Shipping information' },
  { question: 'Can I return a customized jacket?', answer: 'Eligibility depends on the item and reason for the return. Read the policy before ordering a personalized jacket.', href: '/returns', link: 'Read the returns policy' },
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

export default function Home({ categories, featuredProducts, newArrivals, categoryProducts, customDesign }: {
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

  const productGrid = (products: Product[], skeletonCount = 4, showCategory = false) => {
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
            <ProductCard product={product} home categoryLabel={showCategory ? product.featuredCategory?.name : undefined} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqJsonLd) }}
      />
      <section className="border-b bg-muted/30">
        <div className="container mx-auto grid grid-cols-2 gap-3 px-4 py-4 lg:grid-cols-4">
          {trustItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs font-medium sm:text-sm">
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
                    className="group min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-zinc-100">
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
                    </div>
                    <h3 className="py-3 text-center text-sm font-semibold leading-snug sm:text-base">
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

        {customDesign}

        <CustomOptionsSection compact />

        <section className="store-section store-section--plain" aria-labelledby="home-products-heading">
          <div className="section-shell">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div><p className="section-eyebrow">Find your next jacket</p><h2 id="home-products-heading" className="section-title">Styles to make your own</h2></div>
              <Link href="/shop" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4">Shop all jackets <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            </div>
            <Tabs defaultValue="featured">
              <TabsList aria-label="Jacket collections" className="mb-5 h-12 w-full sm:w-fit">
                <TabsTrigger value="featured" className="min-h-11 px-5">Featured</TabsTrigger>
                {newArrivals.length > 0 && <TabsTrigger value="new" className="min-h-11 px-5">New Arrivals</TabsTrigger>}
              </TabsList>
              <TabsContent value="featured">{productGrid(featuredProducts, 4, true)}</TabsContent>
              {newArrivals.length > 0 && <TabsContent value="new">{productGrid(newArrivals)}</TabsContent>}
            </Tabs>
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

        <HomeGroupOrders />

        <section className="store-section store-section--soft store-section--accent">
          <div className="section-shell grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Help & support</p>
              <h2 className="mt-2 text-2xl font-bold md:text-3xl">Before you order</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                Find quick answers about jacket sizing, custom details, and group orders.
              </p>
              <div className="mt-4"><WhatsAppButton message="I need help choosing or designing my jacket." /></div>
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

        <RecentlyViewed limit={4} sectionClassName="store-section store-section--soft" />

        {articles.length > 0 && (
          <section className="store-section store-section--plain">
            <div className="section-shell">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase text-primary">Jacketee Journal</p>
                  <h2 className="mt-2 text-2xl font-bold md:text-3xl">The stories behind your next jacket</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Fresh ideas, practical guides, and the details that make a jacket yours.
                  </p>
                </div>
                <Link href="/blog" className="inline-flex items-center text-sm font-semibold hover:underline">
                  View all articles <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map(article => <BlogCard key={article.id} article={article} />)}
              </div>
            </div>
          </section>
        )}
      </main>





      <Footer />
    </>
  )
}
