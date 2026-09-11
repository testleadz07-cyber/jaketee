'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BadgeCheck, PackageSearch, Palette, Ruler, ShoppingBag } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ProductCard } from '@/components/product-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { resolveAncestorChain, buildCategoryUrl } from '@/lib/categories'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string | null
  _count?: { products: number }
}

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice?: number | null
  images: Array<{ url: string; alt: string }>
  category: { name: string; slug: string }
  categoryPath?: Array<{ name: string; slug: string }>
  isFeatured: boolean
  inStock: boolean
}

interface CategoryDetailViewProps {
  slug: string
}

const CATEGORY_HERO_IMAGES: Record<string, string> = {
  'varsity-jackets': 'https://res.cloudinary.com/dhdfbl8pc/image/upload/v1779379760/jacketee/products/Black-and-Yellow-Leather-Varsity-Jacket_large.png',
  'bomber-jackets': 'https://res.cloudinary.com/dhdfbl8pc/image/upload/v1781527499/jacketee/products/0c44dd44-92ef-48a1-b625-b455ed8df144.png',
  'coach-jackets': 'https://res.cloudinary.com/dhdfbl8pc/image/upload/v1781020878/jacketee/products/Gemini_Generated_Image_aare9aare9aare9a.png',
  'denim-jackets': 'https://res.cloudinary.com/dhdfbl8pc/image/upload/v1781020878/jacketee/products/Gemini_Generated_Image_aare9aare9aare9a.png',
  'fleece-hoodies': 'https://res.cloudinary.com/dhdfbl8pc/image/upload/v1780835508/jacketee/products/06306bd3-b080-46d4-8b6a-a2cdcea932a0.png',
  'leather-jackets': 'https://res.cloudinary.com/dhdfbl8pc/image/upload/v1784635421/jacketee/products/ChatGPT%20Image%20Jul%2021%2C%202026%2C%2005_02_29%20PM.png',
  'puffer-jackets': 'https://res.cloudinary.com/dhdfbl8pc/image/upload/v1781028621/jacketee/products/navy-blue-puffer-jacket/2c818510-6f3d-4c24-9d0c-c9f295f03443.jpg',
}

const DEFAULT_CATEGORY_HERO_IMAGE = CATEGORY_HERO_IMAGES['varsity-jackets']
const PRODUCTS_PER_PAGE = 12

function isUsableHeroImage(image?: string | null) {
  return Boolean(image && image !== '/placeholder.png')
}

export function CategoryDetailView({ slug }: CategoryDetailViewProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isMissing, setIsMissing] = useState(false)
  const [sortBy, setSortBy] = useState('featured')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [categoryHeroImage, setCategoryHeroImage] = useState<{ slug: string; image: string | null } | null>(null)

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setCurrentPage(1)
    setProducts([])
    setTotalProducts(0)
  }

  useEffect(() => {
    let cancelled = false

    const loadHeroImage = async () => {
      try {
        const params = new URLSearchParams({
          category: slug,
          sort: 'featured',
          limit: '1',
        })
        const res = await fetch(`/api/products?${params.toString()}`)
        const data: Product[] = await res.json()
        if (cancelled) return

        const image = data.find((product) => isUsableHeroImage(product.images?.[0]?.url))?.images[0]?.url || null
        setCategoryHeroImage({ slug, image })
      } catch (error) {
        if (!cancelled) setCategoryHeroImage({ slug, image: null })
      }
    }

    loadHeroImage()

    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const isFirstPage = currentPage === 1
      if (isFirstPage) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setIsMissing(false)
      try {
        const catRes = await fetch('/api/categories')
        const catData: Category[] = await catRes.json()
        if (cancelled) return
        setCategories(catData)

        const current = catData.find((c) => c.slug === slug)
        if (!current) {
          setIsMissing(true)
          return
        }

        const params = new URLSearchParams({ category: slug })
        params.set('page', String(currentPage))
        params.set('limit', String(PRODUCTS_PER_PAGE))
        if (sortBy === 'price-asc') {
          params.set('sort', 'price')
          params.set('order', 'asc')
        } else if (sortBy === 'price-desc') {
          params.set('sort', 'price')
          params.set('order', 'desc')
        } else if (sortBy === 'name') {
          params.set('sort', 'name')
          params.set('order', 'asc')
        } else {
          params.set('sort', sortBy)
        }

        const prodRes = await fetch(`/api/products?${params.toString()}`)
        const prodData = await prodRes.json()
        if (cancelled) return
        setTotalProducts(Number(prodRes.headers.get('X-Total-Count') || prodData.length))
        setProducts((prev) => {
          if (isFirstPage) return prodData
          const existingIds = new Set(prev.map((product) => product.id))
          return [...prev, ...prodData.filter((product: Product) => !existingIds.has(product.id))]
        })

        if (current && isFirstPage) {
          import('@/lib/activity').then(({ logUserActivity }) => {
            logUserActivity('view_category', { categoryId: current.id, name: current.name, slug })
          })
        }
      } catch (error) {
        console.error('Error loading category page:', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug, sortBy, currentPage])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="container mx-auto flex-1 px-4 py-8">
          <div className="mb-6 h-5 w-56 animate-pulse rounded bg-muted" />
          <div className="mb-10 grid gap-6 rounded-lg border bg-card p-5 md:grid-cols-[1fr_320px] md:p-8">
            <div className="space-y-4">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
            <div className="hidden aspect-[4/3] animate-pulse rounded-md bg-muted md:block" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="aspect-[3/4] animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (isMissing) {
    notFound()
  }

  const category = categories.find((c) => c.slug === slug)
  if (!category) return null

  const chainInput = categories.map((c) => ({ ...c, _id: c.id }))
  const ancestorChain = resolveAncestorChain(chainInput, category.id)
  const subcategories = categories.filter((c) => c.parentId === category.id)
  const productCount = totalProducts || category._count?.products || products.length
  const canLoadMore = products.length < totalProducts
  const rootCategorySlug = ancestorChain[0]?.slug || category.slug
  const productHeroImage = products.find((product) => isUsableHeroImage(product.images?.[0]?.url))?.images[0]?.url
  const heroImage =
    (categoryHeroImage?.slug === slug ? categoryHeroImage.image : null) ||
    productHeroImage ||
    (isUsableHeroImage(category.image) ? category.image : null) ||
    CATEGORY_HERO_IMAGES[category.slug] ||
    CATEGORY_HERO_IMAGES[rootCategorySlug] ||
    DEFAULT_CATEGORY_HERO_IMAGE
  const heroFeatures = [
    { label: 'Custom colors', icon: Palette },
    { label: 'Patch ready', icon: BadgeCheck },
    { label: 'Size guidance', icon: Ruler },
  ]

  const breadcrumbItems = [
    ...ancestorChain.slice(0, -1).map((ancestor, index) => ({
      label: ancestor.name,
      href: buildCategoryUrl(ancestorChain.slice(0, index + 1)),
    })),
    { label: category.name },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="container mx-auto px-4 py-8 flex-1">
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        <div className="mb-10 overflow-hidden rounded-lg border bg-[#111315] text-white shadow-sm">
          <div className="grid min-h-[420px] gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative flex flex-col justify-center p-6 md:p-10 lg:p-12">
              <div className="absolute left-0 top-8 h-24 w-1 rounded-r-full bg-white/70" />
              <Badge className="mb-5 w-fit border-white/15 bg-white/10 text-white hover:bg-white/10">
                {productCount} {productCount === 1 ? 'product' : 'products'}
              </Badge>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/60">
                Jacketee Collection
              </p>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/72 md:text-lg">
                  {category.description}
                </p>
              )}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="bg-white text-black hover:bg-white/90">
                  <a href="#category-products">
                    Shop Products
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/materials-colors">Compare Materials</Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {heroFeatures.map((feature) => (
                  <span
                    key={feature.label}
                    className="inline-flex items-center gap-2 rounded-md border border-white/[0.12] bg-white/[0.07] px-3 py-2 text-sm text-white/80"
                  >
                    <feature.icon className="h-4 w-4 text-white" />
                    {feature.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative min-h-[320px] overflow-hidden bg-[#f3f0ec] lg:min-h-full">
              {heroImage ? (
                <Image
                  src={heroImage}
                  alt={category.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-contain p-6 md:p-10"
                  unoptimized={heroImage.startsWith('http')}
                  priority
                />
              ) : (
                <div className="flex h-full min-h-[260px] items-center justify-center">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 rounded-md border border-white/35 bg-black/45 px-3 py-2 text-xs font-medium text-white backdrop-blur">
                Built for custom jackets and team-ready orders
              </div>
            </div>
          </div>
        </div>

        {subcategories.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-primary">Browse deeper</p>
                <h2 className="mt-1 text-2xl font-bold">Shop by style or material</h2>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={buildCategoryUrl([...ancestorChain, sub])}
                  className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{sub.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {sub._count?.products || 0} products
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div id="category-products" className="mb-5 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Showing {products.length} of {productCount} {productCount === 1 ? 'item' : 'items'} in {category.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by</span>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {canLoadMore && (
              <div className="mt-10 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentPage((page) => page + 1)}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load more products'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-dashed py-16 text-center">
            <PackageSearch className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-xl font-semibold">No products found</h3>
            <p className="mt-2 text-muted-foreground">This category does not have products yet.</p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/shop">Browse all products</Link>
            </Button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
