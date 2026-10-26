'use client'

import { useSearchParams } from 'next/navigation'
import { CatalogPending } from '@/components/catalog-pending'
import { PageLoading } from '@/components/page-loading'


import { startTransition, useEffect, useRef, useState  } from 'react'
import type { MouseEvent } from 'react'
import { CategoryFilters, AppliedCategoryFilters, type CategoryFacetData } from '@/components/category-filters'
import { catalogSelectionKey, appendCatalogFilters, readCatalogFilters, emptyCatalogFilters, type CatalogFilters } from '@/lib/catalog-filters'
import { CollectionSupport } from '@/components/collection-support'
import { getCategoryHeroDescription } from '@/data/category-hero-copy'
import { CollectionDesignImage } from '@/components/collection-design-image'
import { CustomDesignCollection, type CustomDesignImages } from '@/components/custom-design-collection'
import { RecentlyViewed } from '@/components/RecentlyViewed'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { WhatsAppHelp } from '@/components/whatsapp-help'
import Image from '@/components/optimized-image'
import { ArrowRight, BadgeCheck, MessageCircle, PackageSearch, Palette, RefreshCw, Ruler, Truck, Users } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ProductCard } from '@/components/product-card'
import { productGridClassName } from '@/lib/product-grid'
import { Button } from '@/components/ui/button'
import { CatalogSort } from '@/components/catalog-sort'
import { resolveAncestorChain, buildCategoryUrl } from '@/lib/categories'
import { logUserActivity } from '@/lib/activity'
import { useActivityView } from '@/hooks/use-activity-view'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  heading?: string
  introShort?: string
  introLong?: string
  image?: string
  designImages?: string[]
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
  compareAtPriceVerified?: boolean
  images: Array<{ url: string; alt: string }>
  category: { name: string; slug: string }
  categoryPath?: Array<{ name: string; slug: string }>
  isFeatured: boolean
  inStock: boolean
}

interface CategoryDetailViewProps {
  slug: string
  initialCategories?: Category[]
  initialProducts?: Product[]
  initialTotalProducts?: number
  initialPage?: number
  pageSize?: number
  initialFilters?: CatalogFilters
  initialSort?: string
  customDesignImages?: CustomDesignImages
  initialFacets?: CategoryFacetData
  initialInsights?: CategoryInsights
}

interface CategoryInsights {
  reviewCount: number
  averageRating: number
  reviews: Array<{ id: string; rating: number; title: string; comment: string; userName: string; productName: string; productHref: string }>
  faqs: Array<{ id: string; question: string; answer: string[]; bullets: string[]; ordered: string[]; href?: string }>
}

const CATEGORY_OVERVIEW: Record<string, string> = {
  'varsity-jackets': 'Explore letterman-inspired styles for personal wear, schools, and teams. Compare the body and sleeve materials, fit, and decoration options on each jacket before ordering.',
  'bomber-jackets': 'Browse shorter jacket silhouettes and compare the fabric, lining, and fit details of each bomber style. Product pages show the options available for that jacket.',
  'coach-jackets': 'Compare lightweight coach-jacket styles, their closures, fabric choices, and the decoration options shown on each product page.',
  'denim-jackets': 'Explore denim outerwear and compare washes, fit, and available customization options across the jackets in this collection.',
  'fleece-hoodies': 'Compare fleece and hooded layers by fabric, fit, and available colors. Check each product page for its exact construction and sizing options.',
  'leather-jackets': 'Browse leather styles and compare the material, lining, fit, and care details provided for each jacket.',
  'puffer-jackets': 'Compare insulated outerwear by construction, fit, and product-specific material details before choosing a puffer jacket.',
}

const DEFAULT_PRODUCTS_PER_PAGE = 24
const EMPTY_INSIGHTS: CategoryInsights = { reviewCount: 0, averageRating: 0, reviews: [], faqs: [] }

function renderInlineLinks(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^\)]+\))/g)
  return parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/)
    return match
      ? <Link key={`${match[2]}-${index}`} href={match[2]} className="font-medium text-foreground underline underline-offset-4">{match[1]}</Link>
      : part
  })
}

function CategoryLongContent({ content }: { content: string }) {
  return (
    <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
      {content.split(/\n\n+/).map((block, index) => {
        const lines = block.trim().split('\n')
        const heading = lines[0].startsWith('### ') ? lines.shift()?.slice(4) : null
        const body = lines.join(' ').trim()
        return (
          <section key={`${heading || 'paragraph'}-${index}`}>
            {heading && <h3 className="text-lg font-semibold">{heading}</h3>}
            {body && <p className={`${heading ? 'mt-3' : ''} leading-7 text-muted-foreground`}>{renderInlineLinks(body)}</p>}
          </section>
        )
      })}
    </div>
  )
}

export function CategoryDetailView({
  slug,
  initialCategories = [],
  initialProducts = [],
  initialTotalProducts = 0,
  initialPage = 1,
  pageSize = DEFAULT_PRODUCTS_PER_PAGE,
  initialInsights,
  initialFacets,
  customDesignImages,
  initialFilters = emptyCatalogFilters,
  initialSort = 'featured',
}: CategoryDetailViewProps) {
  const queryString = useSearchParams().toString()
  const selection = useRef(catalogSelectionKey(initialFilters, slug, initialSort, initialPage))
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(initialProducts.length === 0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isMissing, setIsMissing] = useState(false)
  const [filters, setFilters] = useState<CatalogFilters>(initialFilters)
  const [facets, setFacets] = useState<CategoryFacetData>(initialFacets || { groups: [], minPrice: 0, maxPrice: 0 })
  const [fetchError, setFetchError] = useState(false)
  const [sortBy, setSortBy] = useState(initialSort)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalProducts, setTotalProducts] = useState(initialTotalProducts)
  const [insights, setInsights] = useState<CategoryInsights | null>(initialInsights || null)
  const skipInitialProductFetch = useRef(initialCategories.length > 0)
  const [searchDraft, setSearchDraft] = useState(initialFilters.search)
  const trackedCategory = categories.find(category => category.slug === slug)
  useActivityView('view_category', { categoryId: trackedCategory?.id, slug }, Boolean(trackedCategory))

  useEffect(() => {
    const params = new URLSearchParams(queryString)
    const restored = readCatalogFilters(params)
    const nextSort = ['featured', 'newest', 'price-asc', 'price-desc', 'name'].includes(params.get('sort') || '') ? params.get('sort')! : 'featured'
    const nextPage = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1)
    const key = catalogSelectionKey(restored, slug, nextSort, nextPage)
    if (key === selection.current) return
    selection.current = key
    startTransition(() => {
      setSearchDraft(restored.search); setFilters(restored); setSortBy(nextSort)
      setCurrentPage(nextPage); setLoading(true)
    })
  }, [slug, queryString])
  useEffect(() => {
    const nextSearch = searchDraft.trim().slice(0, 200)
    if (nextSearch === filters.search) return
    const timer = setTimeout(() => applyFilters({ ...filters, search: nextSearch }), 350)
    return () => clearTimeout(timer)
  }, [searchDraft, filters, slug, sortBy])
  useEffect(() => {
    if (initialFacets) return
    let active = true
    fetch(`/api/products?category=${encodeURIComponent(slug)}&facets=true`).then(response => {
      if (!response.ok) throw new Error('Facets unavailable')
      return response.json()
    }).then(data => { if (active) setFacets(data) }).catch(() => { if (active) setFacets({ groups: [], minPrice: 0, maxPrice: 0 }) })
    return () => { active = false }
  }, [slug, initialFacets])

  function applyFilters(next: CatalogFilters, force = false) {
    next = readCatalogFilters(appendCatalogFilters(new URLSearchParams(), next))
    if (!force && catalogSelectionKey(next, slug, sortBy) === catalogSelectionKey(filters, slug, sortBy)) return
    selection.current = catalogSelectionKey(next, slug, sortBy, 1)
    if (catalogSelectionKey(next) === catalogSelectionKey(emptyCatalogFilters)) {
      const anchor = document.getElementById('category-products')
      if (anchor && anchor.getBoundingClientRect().top < 0) anchor.scrollIntoView({ block: 'start' })
    }
    setLoading(true)
    setSearchDraft(next.search)
    setFilters({ ...next })
    const urlParams = appendCatalogFilters(new URLSearchParams(), next)
    if (sortBy !== 'featured') urlParams.set('sort', sortBy)
    window.history.pushState(null, '', `${window.location.pathname}${urlParams.size ? `?${urlParams}` : ''}`)
    setCurrentPage(1)

  }

  useEffect(() => {
    if (initialInsights) return
    let active = true
    fetch(`/api/category-insights/${encodeURIComponent(slug)}`)
      .then((response) => response.ok ? response.json() : EMPTY_INSIGHTS)
      .then((data) => { if (active) setInsights(data) })
      .catch((error) => { console.error('Error loading category insights:', error); if (active) setInsights(EMPTY_INSIGHTS) })
    return () => { active = false }
  }, [slug, initialInsights])

  const handleSortChange = (value: string) => {
    if (value === sortBy) return
    selection.current = catalogSelectionKey(filters, slug, value, 1)
    logUserActivity('sort_changed', { sortOption: value, category: slug })
    setLoading(true)
    setSortBy(value)
    const urlParams = appendCatalogFilters(new URLSearchParams(), filters)
    if (value !== 'featured') urlParams.set('sort', value)
    window.history.pushState(null, '', `${window.location.pathname}${urlParams.size ? `?${urlParams}` : ''}`)
    setCurrentPage(1)

  }

  useEffect(() => {
    if (skipInitialProductFetch.current) {
      skipInitialProductFetch.current = false
      setLoading(false)
      return
    }
    let cancelled = false
    const controller = new AbortController()

    const load = async () => {
      const isFirstPage = currentPage === 1
      if (isFirstPage) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setIsMissing(false)
      setFetchError(false)
      try {
        const catData: Category[] = categories.length ? categories : await fetch('/api/categories', { signal: controller.signal }).then(response => { if (!response.ok) throw new Error('Categories unavailable'); return response.json() })
        if (cancelled) return
        setCategories(previous => catData.map(item => ({ ...item, image: item.image || previous.find(existing => existing.id === item.id)?.image, designImages: previous.find(existing => existing.id === item.id)?.designImages })))

        const current = catData.find((c) => c.slug === slug)
        if (!current) {
          setIsMissing(true)
          return
        }

        const params = appendCatalogFilters(new URLSearchParams({ category: slug }), filters)
        params.set('page', String(currentPage))
        params.set('limit', String(pageSize))
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

        const prodRes = await fetch(`/api/products?${params.toString()}`, { signal: controller.signal })
        if (!prodRes.ok) throw new Error('Products unavailable')
        const prodData = await prodRes.json()
        if (!Array.isArray(prodData)) throw new Error('Invalid catalog response')
        if (cancelled) return
        setTotalProducts(Number(prodRes.headers.get('X-Total-Count') || prodData.length))
        setProducts(prodData)

      } catch (error) {
        if (controller.signal.aborted) return
        console.error('Error loading category page:', error)
        if (!cancelled) setFetchError(true)
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
      controller.abort()
    }
  }, [slug, sortBy, currentPage, initialPage, pageSize, filters])

  if (loading && categories.length === 0) {
    return <PageLoading label="Loading collection…" />
  }

  if (isMissing) {
    notFound()
  }

  const category = categories.find((c) => c.slug === slug)
  if (!category) return null

  const chainInput = categories.map((c) => ({ ...c, _id: c.id }))
  const ancestorChain = resolveAncestorChain(chainInput, category.id)
  const subcategories = categories.filter((c) => c.parentId === category.id)
  const productCount = totalProducts
  const collectionCount = category._count?.products ?? initialTotalProducts
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(emptyCatalogFilters)
  const hasFilterControls = collectionCount > 1 && (facets.groups.length > 0 || facets.maxPrice > facets.minPrice)
  const totalPages = Math.max(1, Math.ceil(productCount / pageSize))
  const currentPageForLinks = Math.min(Math.max(1, currentPage), totalPages)
  const categoryUrl = buildCategoryUrl(ancestorChain)
  const pageHref = (page: number) => {
    const params = appendCatalogFilters(new URLSearchParams(), filters)
    if (sortBy !== 'featured') params.set('sort', sortBy)
    if (page > 1) params.set('page', String(page))
    return `${categoryUrl}${params.size ? `?${params}` : ''}`
  }
  const changePage = (event: MouseEvent, page: number) => {
    event.preventDefault()
    if (page === currentPage) return
    setLoading(true)

    selection.current = catalogSelectionKey(filters, slug, sortBy, page)
    setCurrentPage(page)
    window.history.pushState(null, '', pageHref(page))
    document.getElementById('category-products')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }
  const paginationPages = Array.from({ length: totalPages }, (_, index) => index + 1)
  const rootCategorySlug = ancestorChain[0]?.slug || category.slug
  const customLandingByCategory: Record<string, { href: string; label: string }> = {
    'varsity-jackets': { href: '/custom-letterman-jackets', label: 'custom letterman jackets' },
    'bomber-jackets': { href: '/custom-bomber-jackets', label: 'custom bomber jackets' },
    'coach-jackets': { href: '/custom-coach-jackets', label: 'custom coach jackets' },
    'denim-jackets': { href: '/custom-denim-jackets', label: 'custom denim jackets' },
    'puffer-jackets': { href: '/custom-puffer-jackets', label: 'custom puffer jackets' },
    'fleece-hoodies': { href: '/custom-hoodies', label: 'custom hoodies' },
  }
  const customLanding = customLandingByCategory[rootCategorySlug]
  const heroImage = category.designImages?.[0] || category.image || initialProducts[0]?.images[0]?.url || subcategories.find(item => item.image)?.image
  const heroImages = [...new Set([...(category.designImages || []), ...(category.image ? [category.image] : []), ...(heroImage ? [heroImage] : [])])]
  const heroDescription = getCategoryHeroDescription(categoryUrl, category.name, category.description || category.introShort)

  const breadcrumbItems = [
    ...ancestorChain.slice(0, -1).map((ancestor, index) => ({
      label: ancestor.name,
      href: buildCategoryUrl(ancestorChain.slice(0, index + 1)),
    })),
    { label: category.name },
  ]

  return (
    <div className="category-page min-h-screen flex flex-col bg-background">
      <Header home />

      <main className="flex-1">
      <div className="section-shell py-6! md:py-8!">
        <Breadcrumbs items={breadcrumbItems} className="mb-5" />
        <section aria-labelledby="category-hero-heading" className="relative isolate grid overflow-hidden rounded-2xl bg-[#242623] text-white sm:grid-cols-[1.2fr_0.8fr]">
          <div className="relative flex flex-col justify-center px-6 py-8 sm:min-h-76 sm:px-10 lg:min-h-80 lg:px-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">{category.parentId ? ancestorChain.at(-2)?.name : 'Jacketee collection'} <span aria-hidden="true" className="mx-2">/</span> {collectionCount} {collectionCount === 1 ? 'style' : 'styles'}</p>
            <h1 id="category-hero-heading" className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{category.heading || category.name}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">{heroDescription}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              <a href="#category-products" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Shop collection <ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
              {customLanding && <Link href={customLanding.href} className="inline-flex min-h-11 items-center text-sm font-semibold text-white underline underline-offset-4 hover:text-white/80">Make it your own</Link>}
            </div>
          </div>
          {heroImage && <div className="relative min-h-64 bg-white sm:min-h-76 lg:min-h-80"><CollectionDesignImage key={`${category.slug}-${heroImages.join('|')}`} urls={heroImages} alt={`${category.name} collection`} priority sizes="(max-width: 639px) 100vw, (max-width: 1280px) 40vw, 512px" className="object-contain p-5 sm:p-6" /></div>}
        </section>
        {(subcategories.length > 0 || category.parentId) && <nav className="mt-6" aria-label={subcategories.length ? 'Shop subcategories' : 'Related materials and styles'}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold">{subcategories.length ? 'Find your style or material' : 'Explore the collection'}</h2>{!category.parentId && <a href="#category-products" className="inline-flex min-h-11 items-center text-xs font-semibold underline">Shop all {collectionCount} styles</a>}{category.parentId && <Link href={buildCategoryUrl(ancestorChain.slice(0, -1))} className="inline-flex min-h-11 items-center text-xs font-semibold underline">View all {ancestorChain.at(-2)?.name}</Link>}</div>
          <div className="flex gap-3 overflow-x-auto pb-3 [scrollbar-width:thin]">
            {(subcategories.length ? subcategories : categories.filter(item => item.parentId === category.parentId).sort((a, b) => Number(b.id === category.id) - Number(a.id === category.id))).filter(item => (item._count?.products || 0) > 0).map(sub => (
              <Link key={sub.id} href={buildCategoryUrl(subcategories.length ? [...ancestorChain, sub] : [...ancestorChain.slice(0, -1), sub])} aria-current={sub.id === category.id ? 'page' : undefined} className={`group flex w-36 shrink-0 items-center gap-3 rounded-xl border bg-card p-3 focus-visible:outline-2 focus-visible:outline-primary sm:w-44 ${sub.id === category.id ? 'border-red-800 ring-1 ring-red-800' : 'hover:border-primary/50'}`}>
                {sub.image && <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#efede8]"><Image src={sub.image} alt="" fill sizes="48px" className="object-contain" /></span>}<span className="min-w-0"><span className="block text-xs font-semibold leading-5 sm:text-sm">{sub.name}</span><span className="mt-0.5 block text-xs text-muted-foreground">{sub._count?.products || 0} {(sub._count?.products || 0) === 1 ? 'style' : 'styles'}</span></span>
              </Link>
            ))}
          </div>
        </nav>}
      </div>

        <section id="category-products" className="store-section store-section--soft scroll-mt-[calc(var(--site-header-height,8rem)+1rem)]" aria-labelledby="category-products-heading">
          <div className="section-shell py-5! md:py-6!">
        <div className="sticky top-[var(--site-header-height,8rem)] z-30 mb-5 flex flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-4 sm:px-5 sm:py-5 lg:static">
          <div><h2 id="category-products-heading" className="text-xl font-semibold">Shop {category.name}</h2><div className="mt-1 flex min-h-5 items-center text-xs text-muted-foreground" role="status" aria-live="polite">{loading || loadingMore ? <CatalogPending active /> : `${products.length} of ${productCount} ${productCount === 1 ? 'style' : 'styles'}`}</div></div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            {hasFilterControls && <div className="flex-1 lg:hidden"><CategoryFilters mode="mobile" value={filters} onApply={next => applyFilters({ ...next, search: searchDraft.trim().slice(0, 200) })} onClear={() => applyFilters(emptyCatalogFilters)} facets={facets} /></div>}
            {collectionCount > 1 && <CatalogSort value={sortBy} onChange={handleSortChange} />}
            <Link href="/size-guide" className="hidden min-h-11 items-center gap-2 px-2 text-xs underline sm:inline-flex"><Ruler aria-hidden="true" className="h-4 w-4" />Size guide</Link>
          </div>
        </div>
        <form role="search" aria-label="Search this collection" className="mb-4 flex flex-wrap gap-2" onSubmit={event => { event.preventDefault(); applyFilters({ ...filters, search: searchDraft.trim().slice(0, 200) }) }}>
          <label htmlFor="collection-search" className="sr-only">Search {category.name}</label>
          <input id="collection-search" type="search" value={searchDraft} onChange={event => setSearchDraft(event.target.value)} placeholder={`Search ${category.name.toLowerCase()}...`} maxLength={200} className="min-h-12 min-w-0 flex-1 rounded-lg border bg-card px-4 py-3 text-base" />

          {filters.search && <Button type="button" variant="outline" className="min-h-11" onClick={() => applyFilters({ ...filters, search: '' })}>Reset search</Button>}
        </form>
        <AppliedCategoryFilters value={filters} onChange={applyFilters} />
        <div className={hasFilterControls ? 'grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]' : ''}>
          {hasFilterControls && <CategoryFilters mode="desktop" value={filters} onApply={next => applyFilters({ ...next, search: searchDraft.trim().slice(0, 200) })} onClear={() => applyFilters(emptyCatalogFilters)} facets={facets} />}
          <div className="relative min-h-48 min-w-0" aria-busy={loading || loadingMore}>
          {fetchError && <p role="alert" className="mb-4 rounded-lg border p-4 text-sm">We could not load these products. <button className="font-semibold underline" onClick={() => applyFilters(filters, true)}>Try again</button></p>}
        {loading && products.length === 0 ? (
          <div className={productGridClassName} aria-label="Loading products">
            {Array.from({ length: 8 }, (_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-md bg-muted" />)}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className={collectionCount === 1 ? "mx-auto grid w-full max-w-sm" : hasFilterControls ? "grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3" : productGridClassName}>
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} listingPosition={index + 1} collection />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label={`${category.name} pagination`}>
                {currentPageForLinks > 1 && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={pageHref(currentPageForLinks - 1)} onClick={event => changePage(event, currentPageForLinks - 1)}>Previous</Link>
                  </Button>
                )}
                {paginationPages.map((page) => (
                  <Button
                    key={page}
                    asChild
                    variant={page === currentPageForLinks ? 'default' : 'outline'}
                    size="sm"
                    aria-current={page === currentPageForLinks ? 'page' : undefined}
                  >
                    <Link href={pageHref(page)} onClick={event => changePage(event, page)}>{page}</Link>
                  </Button>
                ))}
                {currentPageForLinks < totalPages && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={pageHref(currentPageForLinks + 1)} onClick={event => changePage(event, currentPageForLinks + 1)}>Next</Link>
                  </Button>
                )}
              </nav>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-dashed py-16 text-center">
            <PackageSearch className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-xl font-semibold">No products found</h3>
            <p className="mt-2 text-muted-foreground">{hasFilters ? "Try removing a filter or choosing a wider price range." : "More styles are on their way. Explore another material below."}</p>
            {hasFilters && <Button variant="outline" className="mt-4" onClick={() => applyFilters(emptyCatalogFilters)}>Clear filters</Button>}
            <WhatsAppHelp message={`I couldn't find any products in ${category.name}. Can you help me find a suitable product?`} />
            <Button asChild variant="outline" className="mt-6">
              <Link href="/shop">Browse all products</Link>
            </Button>
          </div>
        )}
          </div>
          </div>
          </div>
        </section>

        <div className="section-shell py-6!"><RecentlyViewed limit={4} /></div>

        <CustomDesignCollection categorySlugs={ancestorChain.map(item => item.slug)} categoryName={category.name} categoryImages={category.designImages} categoryImage={category.image || heroImage} images={customDesignImages} />

        <section className="store-section store-section--plain store-section--accent" aria-labelledby="collection-overview-heading">
          <div className="section-shell grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(290px,0.9fr)] lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Collection guide</p>
            <h2 id="collection-overview-heading" className="mt-2 text-2xl font-semibold">About {category.name}</h2>
            <p className="mt-4 leading-7 text-muted-foreground">{category.introShort || category.description || CATEGORY_OVERVIEW[rootCategorySlug] || `Compare the product details, available options, and fit information for the ${category.name} styles in this collection.`}</p>
            <p className="mt-4 text-sm text-muted-foreground">Product specifications and customization options vary by style. Open a product page for its exact details.</p>
          </div>
          <div className="lg:border-l lg:pl-10">
            <h3 className="text-base font-semibold">Plan your order</h3>
            <div className="mt-3 grid gap-x-6 sm:grid-cols-2">
              {[
                { label: 'Materials & colors', href: '/materials-colors', icon: Palette },
                { label: 'Patches & embroidery', href: '/patches-embroidery', icon: BadgeCheck },
                { label: 'Shipping information', href: '/shipping', icon: Truck },
                { label: 'Returns & exchanges', href: '/returns', icon: RefreshCw },
                { label: 'Bulk orders', href: '/bulk-orders/schools', icon: Users },
                { label: 'Contact us', href: '/contact', icon: MessageCircle },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (item.href === '/shipping') logUserActivity('information_opened', { sectionName: 'shipping' })
                    if (item.href === '/returns') logUserActivity('information_opened', { sectionName: 'returns' })
                  }}
                  className="flex items-center justify-between gap-3 border-b py-3 text-sm font-medium hover:text-primary"
                >
                  <span className="flex items-center gap-2"><item.icon className="h-4 w-4 shrink-0" />{item.label}</span><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
              <Link href="/size-guide" onClick={() => logUserActivity('size_guide_opened', { productId: null })} className="flex items-center justify-between gap-3 border-b py-3 text-sm font-medium hover:text-primary">
                <span className="flex items-center gap-2"><Ruler className="h-4 w-4 shrink-0" />Size guide</span><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </div>
          </div>
          </div>
        </section>



        {category.introLong && <section className="store-section store-section--plain"><div className="section-shell py-6!"><details className="group rounded-xl border bg-card p-5"><summary className="cursor-pointer text-lg font-semibold">Materials, fit &amp; care: the {category.name} guide</summary><div className="mt-6"><CategoryLongContent content={category.introLong} /></div></details></div></section>}

      <CollectionSupport key={category.slug} slug={category.slug} name={category.name} initialData={insights || undefined} />
      </main>

      <Footer />
    </div>
  )
}
