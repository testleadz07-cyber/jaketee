import { Header } from '@/components/header'

function Block({ className = '' }: { className?: string }) {
  return <div className={`rounded-lg bg-muted motion-safe:animate-pulse ${className}`} />
}

function Lines({ count = 3 }: { count?: number }) {
  return <div className="space-y-3">{Array.from({ length: count }, (_, index) => <Block key={index} className={`h-4 ${index === count - 1 ? 'w-3/4' : 'w-full'}`} />)}</div>
}

export function ProductCardsSkeleton() {
  return <div aria-hidden="true" className="space-y-6">
    <Block className="h-7 w-52 max-w-full" />
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{[0, 1, 2, 3].map(item => <div key={item} className="min-w-0 space-y-3 rounded-xl border bg-card p-3"><Block className="aspect-square" /><Block className="h-4 w-full" /><Block className="h-4 w-2/3" /><Block className="h-5 w-20" /></div>)}</div>
  </div>
}

export function ReviewEntriesSkeleton() {
  return <div aria-hidden="true" className="space-y-4">{[0, 1].map(item => <div key={item} className="space-y-4 rounded-xl border bg-card p-4 sm:p-5"><div className="flex items-center gap-3"><Block className="size-10 shrink-0 rounded-full" /><div className="min-w-0 flex-1 space-y-2"><Block className="h-4 w-28" /><Block className="h-3 w-20" /></div></div><Lines count={2} /></div>)}</div>
}

export function ProductReviewsSkeleton() {
  return <div role="status" className="space-y-5">
    <span className="sr-only">Loading customer reviews</span>
    <div aria-hidden="true" className="flex flex-wrap items-center justify-between gap-4"><div className="space-y-3"><Block className="h-7 w-48" /><Block className="h-4 w-36" /></div><Block className="h-11 w-36" /></div>
    <ReviewEntriesSkeleton />
  </div>
}

export function ProductDetailsSkeleton() {
  return <div className="min-h-screen min-w-0 bg-background text-foreground">
    <Header />
    <span role="status" className="sr-only">Loading product details</span>
    <main aria-busy="true" className="min-w-0 pb-24 lg:pb-0">
      <div aria-hidden="true" className="container mx-auto min-w-0 px-4 py-6 lg:py-8">
        <div className="mb-2 flex min-h-11 items-center"><Block className="h-4 w-36" /></div>
        <div className="mb-6 flex min-h-5 flex-wrap gap-3"><Block className="h-3 w-12" /><Block className="h-3 w-28" /><Block className="h-3 w-40" /></div>
        <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-10">
          <div className="min-w-0 space-y-4 lg:col-start-1 lg:row-start-1"><Block className="aspect-square w-full" /><div className="grid grid-cols-4 gap-3">{[0, 1, 2, 3].map(item => <Block key={item} className="aspect-square" />)}</div></div>
          <div className="min-w-0 space-y-6 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:border-l lg:pl-10">
            <div className="space-y-3"><Block className="h-4 w-28" /><Block className="h-9 w-full" /><Block className="h-9 w-3/4" /><div className="flex flex-wrap gap-4"><Block className="h-4 w-36" /><Block className="h-4 w-20" /></div></div>
            <div className="border-t pt-5"><Block className="h-9 w-32" /></div>
            <div className="space-y-4 rounded-xl border p-4"><Lines count={3} /></div>
            {[0, 1, 2].map(group => <div key={group} className="space-y-3"><Block className="h-4 w-24" /><div className="flex flex-wrap gap-3">{[0, 1, 2, 3].map(item => <Block key={item} className={group === 0 ? 'size-10 rounded-full' : 'h-11 w-16'} />)}</div></div>)}
            <div className="space-y-3"><Block className="h-4 w-32" /><Block className="h-12 w-full" /></div>
            <Block className="h-11 w-32" /><div className="grid grid-cols-2 gap-3"><Block className="h-14" /><Block className="h-14" /></div>
            <div className="space-y-4 rounded-xl border p-4"><Block className="h-5 w-2/3" /><Lines count={2} /><Block className="h-11 w-full" /></div>
          </div>
          <div className="min-w-0 space-y-6 rounded-xl border p-4 sm:p-5 lg:col-start-1 lg:row-start-2"><Block className="h-6 w-40" /><Lines count={4} /><div className="space-y-4 border-t pt-5"><Block className="h-5 w-36" /><Lines count={5} /></div><div className="space-y-4 border-t pt-5"><Block className="h-5 w-32" /><Lines count={3} /></div></div>
        </div>
      </div>
      <div aria-hidden="true" className="space-y-0">
        <div className="border-y bg-muted/20"><div className="section-shell"><ProductCardsSkeleton /></div></div>
        <div className="section-shell"><ProductReviewsSkeleton /></div>
        <div className="border-y bg-muted/20"><div className="section-shell space-y-6"><Block className="h-7 w-64 max-w-full" /><Block className="h-4 w-3/4" /><div className="space-y-0">{[0, 1, 2, 3].map(item => <div key={item} className="flex min-h-16 items-center justify-between gap-4 border-b py-4"><Block className="h-4 w-3/4" /><Block className="size-4 shrink-0" /></div>)}</div></div></div>
        <div className="section-shell"><ProductCardsSkeleton /></div>
      </div>
    </main>
    <div aria-hidden="true" className="fixed inset-x-0 bottom-0 z-40 flex min-w-0 items-center justify-between gap-3 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"><Block className="h-7 w-28" /><Block className="h-11 w-36" /></div>
  </div>
}
