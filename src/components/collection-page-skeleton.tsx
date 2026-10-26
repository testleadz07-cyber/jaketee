import { Header } from '@/components/header'
import { SkeletonBlock as Block, SkeletonLines as Lines } from '@/components/page-content-skeleton'
import { ProductCardsSkeleton, ProductReviewsSkeleton } from '@/components/product-details-skeleton'

export function CollectionPageSkeleton({ shop = false }: { shop?: boolean }) {
  return <div className="min-h-screen min-w-0 bg-background text-foreground">
    <Header />
    <span role="status" className="sr-only">Loading collection</span>
    <main aria-busy="true" className="min-w-0">
      <div aria-hidden="true" className="section-shell space-y-6 py-6! md:py-8!">
        <Block className="h-3 w-40" />
        <div className="grid overflow-hidden rounded-2xl border bg-card sm:grid-cols-2">
          <div className="space-y-4 p-6 sm:p-8"><Block className="h-3 w-32" /><Block className="h-10 w-full" /><Block className="h-10 w-3/4" /><Lines /><div className="flex gap-3 pt-2"><Block className="h-11 w-36" /><Block className="h-11 w-28" /></div></div>
          {shop ? <div className="grid grid-cols-3 gap-3 p-4 sm:p-6">{[0, 1, 2].map(item => <div key={item} className="space-y-3"><Block className="h-36 sm:h-52" /><Block className="h-3 w-full" /></div>)}</div> : <Block className="min-h-64 rounded-none sm:min-h-80" />}
        </div>
        <div className="flex flex-wrap gap-3">{[0, 1, 2, 3].map(item => <Block key={item} className={shop ? 'h-11 w-28 rounded-full' : 'h-20 w-36'} />)}</div>
      </div>
      <div aria-hidden="true" className="border-y bg-muted/20"><div className="section-shell space-y-5 py-5! md:py-8!">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b bg-background p-4 sm:p-5"><div className="space-y-3"><Block className="h-6 w-48" /><Block className="h-3 w-32" /></div><div className="flex w-full gap-3 sm:w-auto"><Block className="h-12 flex-1 sm:w-28 lg:hidden" /><Block className="h-12 w-40" /></div></div>
        <Block className="h-12 w-full" />
        <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="hidden space-y-6 rounded-xl border bg-card p-4 lg:block"><Block className="h-5 w-32" /><Block className="h-11 w-full" />{[0, 1, 2].map(group => <div key={group} className="space-y-4 border-t pt-4"><Block className="h-4 w-24" />{[0, 1, 2].map(item => <div key={item} className="flex items-center gap-3"><Block className="size-4 shrink-0" /><Block className="h-3 w-3/4" /></div>)}</div>)}</div>
          <div className="min-w-0 space-y-7"><div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map(item => <div key={item} className="min-w-0 space-y-3 rounded-xl border bg-card p-3"><Block className="aspect-square" /><Block className="h-4 w-full" /><Block className="h-4 w-3/4" /><Block className="h-5 w-20" /></div>)}</div><div className="flex justify-center gap-2">{[0, 1, 2].map(item => <Block key={item} className="size-11" />)}</div></div>
        </div>
      </div></div>
      <div aria-hidden="true" className="section-shell space-y-10">
        <div className="grid items-center gap-7 rounded-2xl border bg-card p-5 lg:grid-cols-2"><Block className="aspect-[4/3]" /><div className="space-y-5"><Block className="h-8 w-3/4" /><Lines count={4} /><Block className="h-12 w-44" /></div></div>
        <ProductCardsSkeleton />
        <div className="grid gap-7 md:grid-cols-2">{[0, 1].map(item => <div key={item} className="space-y-5"><Block className="h-7 w-2/3" /><Lines count={5} /></div>)}</div>
        <ProductReviewsSkeleton />
        <div className="space-y-5"><Block className="h-7 w-48" />{[0, 1, 2, 3].map(item => <div key={item} className="flex min-h-16 items-center justify-between gap-4 border-b"><Block className="h-4 w-3/4" /><Block className="size-4 shrink-0" /></div>)}</div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map(item => <div key={item} className="space-y-4 rounded-xl border bg-card p-3"><Block className="aspect-[16/10]" /><Block className="h-5 w-4/5" /><Lines count={2} /></div>)}</div>
      </div>
    </main>
  </div>
}
