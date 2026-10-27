'use client'

import { startTransition, useState, useEffect, useRef } from 'react'
import { catalogSortValue, broaderSearches, type SearchMatch } from '@/lib/product-search'
import { useSearchParams } from 'next/navigation'
import { CatalogPending } from '@/components/catalog-pending'
import Link from 'next/link'
import Image from '@/components/optimized-image'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ProductCard } from '@/components/product-card'
import { CustomDesignCollection, type CustomDesignImages } from '@/components/custom-design-collection'
import { resolveAncestorChain } from '@/lib/categories'
import { CollectionSupport } from '@/components/collection-support'
import { RecentlyViewed } from '@/components/RecentlyViewed'
import { CatalogSort } from '@/components/catalog-sort'
import { Button } from '@/components/ui/button'
import { CategoryFilters, AppliedCategoryFilters } from '@/components/category-filters'
import { appendCatalogFilters, readCatalogFilters, catalogSelectionKey, emptyCatalogFilters, type CatalogFilters, type CatalogFacetData } from '@/lib/catalog-filters'

export interface Product {
  searchMatch?: SearchMatch
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
  designImages?: string[]
  id: string
  name: string
  slug: string
  parentId?: string | null
  _count: {
    products: number
  }
}

const PAGE_SIZE = 24
const sorts = ['featured', 'newest', 'price-asc', 'price-desc', 'name', 'relevance']
export default function ShopClient({ initialProducts, initialCategories, initialTotal, initialCategory, initialFilters, initialSort, initialPage, initialFacets, heroImages, customDesignImages }: {
  initialProducts: Product[]; initialCategories: Category[]; initialTotal: number; initialCategory: string;
  customDesignImages: CustomDesignImages;
  heroImages: Array<{ src: string; alt: string; label: string; href: string }>;
  initialFilters: CatalogFilters; initialSort: string; initialPage: number; initialFacets: CatalogFacetData;
}) {
  const queryString = useSearchParams().toString()
  const selection = useRef(catalogSelectionKey(initialFilters, initialCategory, initialSort, initialPage))
  const [products, setProducts] = useState(initialProducts)
  const [total, setTotal] = useState(initialTotal)
  const [category, setCategory] = useState(initialCategory)
  const [filters, setFilters] = useState(initialFilters)
  const [search, setSearch] = useState(initialFilters.search)
  const [sort, setSort] = useState(initialSort)
  const [page, setPage] = useState(initialPage)
  const [facets, setFacets] = useState(initialFacets)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const firstFetch = useRef(true)
  const firstFacets = useRef(true)
  const categories = initialCategories
  const roots = categories.filter(item => !item.parentId && item._count.products > 0)
  const selected = categories.find(item => item.slug === category)
  const root = selected?.parentId ? categories.find(item => item.id === selected.parentId) : selected
  const children = root ? categories.filter(item => item.parentId === root.id && item._count.products > 0) : []
  const paramsFor = (nextFilters = filters, nextCategory = category, nextSort = sort, nextPage = page) => {
    const params = appendCatalogFilters(new URLSearchParams(), nextFilters)
    if (nextCategory !== 'all') params.set('category', nextCategory)
    if (nextSort !== (nextFilters.search ? 'relevance' : 'featured')) params.set('sort', nextSort)
    if (nextPage > 1) params.set('page', String(nextPage))
    return params
  }
  const update = (nextFilters = filters, nextCategory = category, nextSort = sort, nextPage?: number) => {
    const normalized = readCatalogFilters(appendCatalogFilters(new URLSearchParams(), nextFilters))
    if (normalized.search && !filters.search && nextSort === 'featured') nextSort = 'relevance'
    if (!normalized.search && nextSort === 'relevance') nextSort = 'featured'
    const sameInputs = catalogSelectionKey(normalized, nextCategory, nextSort) === catalogSelectionKey(filters, category, sort)
    const targetPage = nextPage ?? (sameInputs ? page : 1)
    const key = catalogSelectionKey(normalized, nextCategory, nextSort, targetPage)
    if (key === selection.current) return
    selection.current = key
    if (catalogSelectionKey(normalized) === catalogSelectionKey(emptyCatalogFilters)) {
      const anchor = document.getElementById('shop-products')
      if (anchor && anchor.getBoundingClientRect().top < 0) anchor.scrollIntoView({ block: 'start' })
    }
    setFilters(normalized); setSearch(normalized.search); setCategory(nextCategory); setSort(nextSort); setPage(targetPage)
    setLoading(true)
    const params = paramsFor(normalized, nextCategory, nextSort, targetPage)
    window.history.pushState(null, '', '/shop' + (params.size ? '?' + params : ''))
  }
  useEffect(() => {
    const params = new URLSearchParams(queryString)
    const restored = readCatalogFilters(params)
    const nextCategory = params.get('category') || 'all'
    const nextSort = catalogSortValue(params.get('sort'), Boolean(restored.search))
    const nextPage = Math.max(1, parseInt(params.get('page') || '1') || 1)
    const key = catalogSelectionKey(restored, nextCategory, nextSort, nextPage)
    if (key === selection.current) return
    selection.current = key
    startTransition(() => {
      setFilters(restored); setSearch(restored.search); setCategory(nextCategory)
      setSort(nextSort); setPage(nextPage); setLoading(true)
    })
  }, [queryString])
  useEffect(() => {
    const nextSearch = search.trim().slice(0, 200)
    if (nextSearch === filters.search) return
    const timer = setTimeout(() => update({ ...filters, search: nextSearch }), 350)
    return () => clearTimeout(timer)
  }, [search, filters, category, sort])
  useEffect(() => {
    if (firstFacets.current) { firstFacets.current = false; return }
    const controller = new AbortController()
    const params = new URLSearchParams({ facets: 'true' })
    if (filters.search) params.set('search', filters.search)
    if (category !== 'all') params.set('category', category)
    fetch(`/api/products?${params}`, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Filters unavailable')
      return response.json()
    }).then(setFacets).catch(() => {})
    return () => controller.abort()
  }, [category, filters.search])
  useEffect(() => {
    if (firstFetch.current) { firstFetch.current = false; return }
    const controller = new AbortController()
    const load = async () => {
      setError(false)
      try {
        const params = appendCatalogFilters(new URLSearchParams(), filters)
        if (category !== 'all') params.set('category', category)
        params.set('page', String(page)); params.set('limit', String(PAGE_SIZE))
        params.set('sort', sort.startsWith('price-') ? 'price' : sort)
        if (sort.startsWith('price-')) params.set('order', sort === 'price-asc' ? 'asc' : 'desc')
        if (sort === 'name') params.set('order', 'asc')
        const response = await fetch(`/api/products?${params}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Products unavailable')
        const data = await response.json()
        if (!Array.isArray(data)) throw new Error('Invalid response')
        if (controller.signal.aborted) return
        setProducts(data); setTotal(Number(response.headers.get('X-Total-Count') || data.length))
      } catch { if (!controller.signal.aborted) setError(true) }
      finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void load()
    return () => controller.abort()
  }, [category, filters, sort, page, retry])
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  return <div className="category-page flex min-h-screen flex-col bg-background">
    <Header home />
    <main className="flex-1">
      <section className="section-shell py-6! md:py-8!">
        <Breadcrumbs items={[{ label: 'Shop all' }]} className="mb-5" />
        <div className="grid overflow-hidden rounded-2xl border bg-[#242623] text-white lg:grid-cols-[1.15fr_1fr]">
          <div className="px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">The Jacketee collection</p>
            <h1 className="mt-3 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Shop Custom Jackets, Hoodies &amp; Accessories</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/85">Explore varsity, letterman, bomber, leather, denim, coach and puffer jackets, plus fleece hoodies, patches and embroidery. Find your style and explore personalization for yourself, your school, team or brand.</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-5"><a href="#shop-products" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-3 text-xs font-semibold text-zinc-950 sm:px-4 sm:text-sm hover:bg-stone-100">Shop all products <span aria-hidden="true" className="ml-2">↓</span></a><Link href="/design" className="inline-flex min-h-11 items-center text-xs font-semibold underline underline-offset-4 sm:text-sm">Design your jacket</Link></div>
          </div>
          {heroImages.length > 0 && <div aria-label="Explore jacket collections" className="grid grid-cols-3 gap-2 bg-white px-3 py-4 sm:px-5 lg:items-center lg:py-6">
            {heroImages.map((item, index) => <Link key={item.href} href={item.href} className="group min-w-0 rounded-lg px-1 py-2 text-center text-zinc-900 focus-visible:outline-2 focus-visible:outline-red-800"><div className="relative h-28 sm:h-40 lg:h-52"><Image src={item.src} alt={item.alt} fill sizes="(max-width: 640px) 30vw, (max-width: 1024px) 28vw, 180px" priority={index === 0} className="object-contain" /></div><span className="mt-3 block text-[11px] font-semibold underline-offset-4 group-hover:underline sm:text-xs">{item.label}</span></Link>)}
          </div>}
        </div>
        <nav aria-label="Shop by category" className="mt-6 flex gap-2 overflow-x-auto pb-2 lg:flex-wrap lg:overflow-visible">
          {[{ slug: 'all', name: 'Shop all' }, ...roots].map(item => <button key={item.slug} aria-pressed={item.slug === category || item.slug === root?.slug} onClick={() => update(emptyCatalogFilters, item.slug)} className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors ${item.slug === category || item.slug === root?.slug ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary'}`}>{item.name}</button>)}
        </nav>
        {children.length > 0 && <div className="mt-3"><label htmlFor="shop-subcategory" className="mr-3 text-sm font-medium">Style or material</label><select id="shop-subcategory" value={category} onChange={event => update(emptyCatalogFilters, event.target.value)} className="min-h-11 max-w-full rounded-lg border bg-card px-3 text-sm"><option value={root!.slug}>All {root!.name}</option>{children.map(item => <option key={item.slug} value={item.slug}>{item.name} ({item._count.products})</option>)}</select></div>}
      </section>
      <section id="shop-products" className="store-section store-section--soft scroll-mt-[calc(var(--site-header-height,8rem)+1rem)]">
        <div className="section-shell py-5! md:py-8!">
          <div className="sticky top-[var(--site-header-height,8rem)] z-30 mb-4 flex flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-4 sm:px-5 sm:py-5 lg:static">
            <div><h2 className="text-xl font-semibold">{selected?.name || 'Shop all products'}</h2><div role="status" aria-live="polite" className="mt-1 flex min-h-5 items-center text-xs text-muted-foreground">{loading ? <CatalogPending active /> : `${total ? (page - 1) * PAGE_SIZE + 1 : 0}–${Math.min(page * PAGE_SIZE, total)} of ${total} products`}</div></div>
            <div className="flex w-full gap-2 sm:w-auto"><div className="flex-1 lg:hidden"><CategoryFilters mode="mobile" value={filters} onApply={next => update({ ...next, search: search.trim().slice(0, 200) })} onClear={searchOnly => update(emptyCatalogFilters, searchOnly ? category : 'all')} facets={facets} /></div><CatalogSort searchActive={Boolean(filters.search)} value={sort} onChange={value => update(filters, category, value)} /></div>
          </div>
          <form role="search" aria-label="Search catalog" onSubmit={event => { event.preventDefault(); update({ ...filters, search: search.trim().slice(0, 200) }) }} className="mb-4 flex gap-2"><label htmlFor="shop-search" className="sr-only">Search this collection</label><input id="shop-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by style, material, or name..." maxLength={200} className="min-h-12 min-w-0 flex-1 rounded-lg border bg-card px-4 py-3 text-base" /></form>
          <AppliedCategoryFilters value={filters} onChange={next => update(next)} category={category !== 'all' ? selected?.name || category : undefined} onRemoveCategory={() => update(filters, 'all')} onClearAll={() => update(emptyCatalogFilters, 'all')} />
          <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <CategoryFilters mode="desktop" value={filters} onApply={next => update({ ...next, search: search.trim().slice(0, 200) })} onClear={searchOnly => update(emptyCatalogFilters, searchOnly ? category : 'all')} facets={facets} />
            <div className="relative min-h-48 min-w-0" aria-busy={loading}>
              {error ? <div role="alert" className="rounded-xl border p-6">We couldn’t load products. <button className="underline" onClick={() => { setLoading(true); setRetry(value => value + 1) }}>Try again</button></div> : loading && !products.length ? <div aria-label="Loading products" className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />)}</div> : products.length ? <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">{products.map((product, index) => <ProductCard key={product.id} product={product} listingPosition={index + 1} collection />)}</div> : <div className="rounded-xl border border-dashed px-5 py-14 text-center"><h3 className="text-xl font-semibold">No matching products</h3><p className="mt-2 text-sm text-muted-foreground">Try another search or remove some filters.</p><div className="mt-4 flex flex-wrap justify-center gap-2">{broaderSearches(filters.search).length > 0 && <p className="w-full text-xs text-muted-foreground">Try a broader search</p>}{broaderSearches(filters.search).map(suggestion => <Button key={suggestion} variant="outline" onClick={() => update({ ...filters, search: suggestion })}>{suggestion}</Button>)}</div><Button variant="outline" className="mt-5" onClick={() => update(emptyCatalogFilters)}>Reset search &amp; filters</Button></div>}
              {!loading && !error && pages > 1 && <nav aria-label="Product pages" className="mt-8 flex flex-wrap justify-center gap-2">{Array.from({ length: pages }, (_, index) => index + 1).map(number => <a key={number} href={`/shop?${paramsFor(filters, category, sort, number)}`} aria-current={page === number ? 'page' : undefined} onClick={event => { event.preventDefault(); update(filters, category, sort, number); document.getElementById('shop-products')?.scrollIntoView({ behavior: 'smooth' }) }} className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm ${page === number ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>{number}</a>)}</nav>}
            </div>
          </div>
        </div>
      </section>
      <CustomDesignCollection categorySlugs={selected ? resolveAncestorChain(categories.map(item => ({ ...item, _id: item.id })), selected.id).map(item => item.slug) : []} categoryName={selected?.name} categoryImages={selected?.designImages} images={customDesignImages} />
      <div className="section-shell py-6!"><RecentlyViewed limit={4} /></div>
      <section className="section-shell border-t" aria-labelledby="shop-guide-heading">
        <div className="grid gap-7 md:grid-cols-2 md:gap-12"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Choose your style</p><h2 id="shop-guide-heading" className="mt-2 text-2xl font-semibold">Find the right custom jacket</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">Start with a silhouette you like, then compare the material, fit and available colors on each product page. Explore <Link href="/varsity-jackets" className="font-medium text-foreground underline underline-offset-4">varsity and letterman jackets</Link> for a classic school or team look, or browse <Link href="/bomber-jackets" className="font-medium text-foreground underline underline-offset-4">bomber jackets</Link> for a shorter silhouette.</p></div><div><h3 className="text-lg font-semibold">Make the details yours</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">Compare <Link href="/materials-colors" className="font-medium text-foreground underline underline-offset-4">materials and colors</Link>, check the <Link href="/size-guide" className="font-medium text-foreground underline underline-offset-4">size guide</Link>, and explore <Link href="/patches-embroidery" className="font-medium text-foreground underline underline-offset-4">patches and embroidery</Link> for names, lettering and artwork. Customization options vary by product. Planning jackets for a group? Visit <Link href="/bulk-orders" className="font-medium text-foreground underline underline-offset-4">bulk orders</Link> to explore options for schools, teams and brands.</p></div></div>
      </section>
      <CollectionSupport key={category} slug={category} name={selected?.name || 'all products'} />
    </main>
    <Footer />
  </div>
}
