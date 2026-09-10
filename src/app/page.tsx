'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, Headphones, Palette, PackageCheck, Ruler, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { ProductCard } from '@/components/product-card'
import { RecentlyViewed } from '@/components/RecentlyViewed'
import { Footer } from '@/components/footer'
import { buildCategoryUrl } from '@/lib/categories'
import { getStaticCategoriesWithCount, getStaticProducts } from '@/lib/static-data'

interface Product {
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

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string | null
  _count: {
    products: number
  }
}

const curatedCategorySlugs = [
  'varsity-jackets',
  'bomber-jackets',
  'leather-jackets',
  'puffer-jackets',
  'coach-jackets',
  'denim-jackets',
]

const categorySectionSlugs = ['varsity-jackets', 'bomber-jackets', 'leather-jackets']

const trustItems = [
  { icon: BadgeCheck, label: 'Custom design support' },
  { icon: Palette, label: 'Material and color guidance' },
  { icon: PackageCheck, label: 'Secure checkout' },
  { icon: Headphones, label: 'Help within 24 hours' },
]

async function fetchProducts(path: string) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to fetch ${path}`)
  return res.json()
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>(() => getStaticCategoriesWithCount())
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHomeData = async () => {
      const staticProducts = getStaticProducts() as Product[]
      const inStockStatic = staticProducts.filter((product) => product.inStock)
      const fallbackFeatured = [...inStockStatic]
        .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
        .slice(0, 8)
      const fallbackNewArrivals = inStockStatic.slice(0, 8)

      try {
        const categoryData = getStaticCategoriesWithCount()
        setCategories(categoryData)

        const [featured, newest, ...categoryRows] = await Promise.all([
          fetchProducts('/api/products?sort=featured&limit=8'),
          fetchProducts('/api/products?sort=newest&limit=8'),
          ...categorySectionSlugs.map((slug) => fetchProducts(`/api/products?category=${slug}&sort=featured&limit=4`)),
        ])

        setFeaturedProducts(featured.length ? featured : fallbackFeatured)
        setNewArrivals(newest.length ? newest : fallbackNewArrivals)
        setCategoryProducts(
          categorySectionSlugs.reduce<Record<string, Product[]>>((acc, slug, index) => {
            acc[slug] = categoryRows[index] || []
            return acc
          }, {})
        )
      } catch (error) {
        console.error('Error loading homepage data:', error)
        setFeaturedProducts(fallbackFeatured)
        setNewArrivals(fallbackNewArrivals)
        setCategoryProducts(
          categorySectionSlugs.reduce<Record<string, Product[]>>((acc, slug) => {
            acc[slug] = inStockStatic
              .filter((product) => product.categoryPath?.some((category) => category.slug === slug))
              .slice(0, 4)
            return acc
          }, {})
        )
      } finally {
        setLoading(false)
      }
    }

    loadHomeData()
  }, [])

  const categoryTiles = curatedCategorySlugs
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter(Boolean) as Category[]

  const heroProduct = featuredProducts[0] || newArrivals[0]
  const heroImage = heroProduct?.images?.[0]?.url
  const heroAlt = heroProduct?.images?.[0]?.alt || heroProduct?.name || 'Custom Jacketee jacket'

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
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: index * 0.04 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <section className="relative min-h-[560px] overflow-hidden bg-zinc-950 text-white md:min-h-[680px]">
        {heroImage && (
          <Image
            src={heroImage}
            alt={heroAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-55"
            unoptimized={heroImage.startsWith('https://res.cloudinary.com/')}
          />
        )}
        <div className="absolute inset-0 bg-black/45" />
        <div className="container relative mx-auto flex min-h-[560px] items-center px-4 py-16 md:min-h-[680px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Custom jackets, patches, and embroidery
            </div>
            <h1 className="text-4xl font-black leading-tight md:text-6xl lg:text-7xl">
              Custom Jackets Made To Stand Out
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
          </motion.div>
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
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Shop by category</p>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">Start with the jacket style</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/shop">View All Products</Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryTiles.map((category) => {
              const sampleProduct =
                categoryProducts[category.slug]?.[0] ||
                featuredProducts.find((product) => product.categoryPath?.some((item) => item.slug === category.slug)) ||
                featuredProducts[0]
              const imageUrl = sampleProduct?.images?.[0]?.url

              return (
                <Link
                  key={category.id}
                  href={buildCategoryUrl([{ slug: category.slug }])}
                  className="group relative min-h-[220px] overflow-hidden rounded-lg bg-zinc-900 p-6 text-white"
                >
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={sampleProduct?.images?.[0]?.alt || category.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      className="object-cover opacity-50 transition-transform duration-500 group-hover:scale-105"
                      unoptimized={imageUrl.startsWith('https://res.cloudinary.com/')}
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
        </section>

        <section className="border-y bg-muted/20">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">Featured jackets</p>
                <h2 className="mt-2 text-3xl font-bold md:text-4xl">Selected styles worth seeing first</h2>
              </div>
              <Button asChild variant="outline">
                <Link href="/shop?sort=featured">Shop Featured</Link>
              </Button>
            </div>
            {productGrid(featuredProducts, 8)}
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-4 lg:grid-cols-2">
            <Link
              href="/materials-colors"
              className="group rounded-lg border bg-card p-6 transition-colors hover:border-primary/50 md:p-8"
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
              className="group rounded-lg border bg-card p-6 transition-colors hover:border-primary/50 md:p-8"
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
        </section>

        {categorySectionSlugs.map((slug) => {
          const category = categories.find((item) => item.slug === slug)
          if (!category) return null

          return (
            <section key={slug} className="container mx-auto px-4 pb-12 md:pb-16">
              <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary">Category picks</p>
                  <h2 className="mt-2 text-3xl font-bold md:text-4xl">{category.name}</h2>
                </div>
                <Button asChild variant="outline">
                  <Link href={buildCategoryUrl([{ slug: category.slug }])}>View {category.name}</Link>
                </Button>
              </div>
              {productGrid(categoryProducts[slug] || [], 4)}
            </section>
          )
        })}

        <section className="border-y bg-muted/20">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">New arrivals</p>
                <h2 className="mt-2 text-3xl font-bold md:text-4xl">Fresh styles in the lineup</h2>
              </div>
              <Button asChild variant="outline">
                <Link href="/shop">Browse Catalog</Link>
              </Button>
            </div>
            {productGrid(newArrivals, 8)}
          </div>
        </section>
      </main>

      <div className="container mx-auto px-4 py-12">
        <RecentlyViewed limit={8} />
      </div>

      <Footer />
    </div>
  )
}
