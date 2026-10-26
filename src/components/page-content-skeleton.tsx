export type PageSkeletonLayout = 'article' | 'blog' | 'blog-article' | 'contact' | 'form' | 'checkout' | 'order' | 'account' | 'faq' | 'size-guide' | 'gallery' | 'guide' | 'landing' | 'designer' | 'customizer'

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`min-w-0 rounded-lg bg-muted motion-safe:animate-pulse ${className}`} />
}

export function SkeletonLines({ count = 3 }: { count?: number }) {
  return <div className="space-y-3">{Array.from({ length: count }, (_, index) => <SkeletonBlock key={index} className={`h-4 ${index === count - 1 ? 'w-3/4' : 'w-full'}`} />)}</div>
}

export function SkeletonFields({ count = 4, multiline = true }: { count?: number; multiline?: boolean }) {
  return <div className="space-y-5">{Array.from({ length: count }, (_, index) => <div key={index} className="space-y-2"><SkeletonBlock className="h-3 w-24" /><SkeletonBlock className={multiline && index === count - 1 ? 'h-28 w-full' : 'h-12 w-full'} /></div>)}<SkeletonBlock className="h-12 w-full" /></div>
}

export function SkeletonHero({ image = false }: { image?: boolean }) {
  return <div className={image ? 'grid overflow-hidden rounded-2xl border bg-card sm:grid-cols-2' : 'space-y-4 rounded-2xl border bg-card p-6 sm:p-9'}>
    <div className={image ? 'space-y-4 p-6 sm:p-9' : 'space-y-4'}><SkeletonBlock className="h-3 w-32" /><SkeletonBlock className="h-10 w-4/5" /><SkeletonBlock className="h-10 w-2/3" /><SkeletonLines /><div className="flex gap-3 pt-2"><SkeletonBlock className="h-11 w-36" /><SkeletonBlock className="h-11 w-28" /></div></div>
    {image && <SkeletonBlock className="min-h-60 rounded-none sm:min-h-80" />}
  </div>
}

function ArticleSkeleton() {
  return <div className="grid items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
    <div className="hidden space-y-5 rounded-xl border p-5 lg:block">{[0, 1, 2, 3, 4].map(item => <SkeletonBlock key={item} className="h-4 w-full" />)}</div>
    <div className="mx-auto w-full max-w-4xl space-y-9"><SkeletonBlock className="h-10 w-4/5" /><SkeletonBlock className="h-4 w-36" />{[0, 1, 2, 3].map(item => <div key={item} className="space-y-5"><SkeletonBlock className="h-6 w-1/2" /><SkeletonLines count={5} /></div>)}</div>
  </div>
}

function BlogSkeleton() {
  return <div className="space-y-7"><SkeletonHero /><div className="flex flex-wrap gap-3">{[0, 1, 2, 3].map(item => <SkeletonBlock key={item} className="h-10 w-28 rounded-full" />)}</div><SkeletonBlock className="h-12 w-full" /><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map(item => <div key={item} className="min-w-0 space-y-4 overflow-hidden rounded-xl border bg-card"><SkeletonBlock className="aspect-[16/10] rounded-none" /><div className="space-y-4 p-4"><SkeletonBlock className="h-3 w-24" /><SkeletonBlock className="h-6 w-full" /><SkeletonLines count={2} /><SkeletonBlock className="h-4 w-24" /></div></div>)}</div></div>
}

function BlogArticleSkeleton() {
  return <div className="mx-auto max-w-4xl space-y-8"><SkeletonBlock className="h-10 w-full" /><SkeletonBlock className="h-10 w-3/4" /><div className="flex gap-4"><SkeletonBlock className="h-4 w-28" /><SkeletonBlock className="h-4 w-24" /></div><SkeletonBlock className="aspect-[16/9] w-full" />{[0, 1, 2, 3].map(item => <div key={item} className="space-y-5"><SkeletonBlock className="h-7 w-2/3" /><SkeletonLines count={6} /></div>)}</div>
}

function FaqSkeleton() {
  return <div className="space-y-7"><SkeletonHero /><SkeletonBlock className="h-12 w-full" /><div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]"><div className="hidden space-y-3 lg:block">{[0, 1, 2, 3, 4].map(item => <SkeletonBlock key={item} className="h-12" />)}</div><div>{Array.from({ length: 8 }, (_, item) => <div key={item} className="flex min-h-16 items-center justify-between gap-4 border-b py-4"><SkeletonBlock className="h-4 w-3/4" /><SkeletonBlock className="size-4 shrink-0" /></div>)}</div></div></div>
}

function SummarySkeleton() {
  return <div className="space-y-5 rounded-2xl border bg-card p-5"><SkeletonBlock className="h-6 w-40" />{[0, 1, 2].map(item => <div key={item} className="flex gap-3 border-b pb-4"><SkeletonBlock className="size-16 shrink-0" /><div className="min-w-0 flex-1 space-y-3"><SkeletonBlock className="h-4 w-full" /><SkeletonBlock className="h-3 w-2/3" /><SkeletonBlock className="h-4 w-20" /></div></div>)}<SkeletonLines /><SkeletonBlock className="h-7 w-32" /></div>
}

function DesignerSkeleton({ customizer }: { customizer: boolean }) {
  const controls = <div className="min-w-0 space-y-4">{[0, 1, 2, 3].map(item => <div key={item} className="space-y-4 rounded-xl border bg-card p-5"><SkeletonBlock className="h-5 w-32" /><div className="flex flex-wrap gap-3">{[0, 1, 2, 3].map(option => <SkeletonBlock key={option} className="size-11" />)}</div></div>)}<SkeletonBlock className="h-12 w-full" /></div>
  const preview = <div className="min-w-0 space-y-4"><div className="flex gap-2">{[0, 1, 2, 3].map(item => <SkeletonBlock key={item} className="h-10 w-1/4" />)}</div><SkeletonBlock className="aspect-square w-full" /><SkeletonBlock className="h-12 w-full" /></div>
  return <div className="space-y-6"><SkeletonBlock className="h-9 w-2/3" /><SkeletonLines count={2} />{customizer ? <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"><div className="space-y-4"><SkeletonBlock className="aspect-square" /><div className="grid grid-cols-4 gap-3">{[0, 1, 2, 3].map(item => <SkeletonBlock key={item} className="aspect-square" />)}</div></div><div className="space-y-6">{controls}{preview}</div></div> : <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">{controls}{preview}</div>}</div>
}

export function getPageSkeletonLayout(pathname: string): PageSkeletonLayout {
  const [, section, child] = pathname.split('/')
  if (section === 'blog') return child && child !== 'category' ? 'blog-article' : 'blog'
  if (section === 'checkout') return 'checkout'
  if (section === 'order-confirmation' || section === 'profile' && child === 'orders') return 'order'
  if (section === 'profile') return child === 'claim-orders' ? 'form' : 'account'
  if (section === 'contact') return 'contact'
  if (['track-order', 'login', 'register', 'forgot-password', 'reset-password'].includes(section)) return 'form'
  if (section === 'faq') return 'faq'
  if (section === 'size-guide') return 'size-guide'
  if (section === 'customize') return 'customizer'
  if (['design', 'custom-design', 'custom-jacket-designer', 'design-your-jacket', 'design-your-own'].includes(section)) return 'designer'
  if (['patches-embroidery', 'materials-colors'].includes(section)) return 'gallery'
  if (section === 'how-to-customize' || section === 'about') return 'guide'
  if (section === 'bulk-orders' || section?.startsWith('custom-')) return 'landing'
  if (section === 'admin') return 'account'
  return 'article'
}

export function SectionLoadingSkeleton({ layout, label }: { layout: PageSkeletonLayout; label: string }) {
  return <div role="status"><span className="sr-only">{label}</span><PageContentSkeleton layout={layout} /></div>
}

/** Decorative body only: the caller keeps the real site header outside it. */
export function PageContentSkeleton({ layout }: { layout: PageSkeletonLayout }) {
  return <div aria-hidden="true" className="min-w-0 space-y-7">
    <SkeletonBlock className="h-3 w-36" />
    {layout === 'blog' ? <BlogSkeleton /> : layout === 'blog-article' ? <BlogArticleSkeleton /> : layout === 'article' ? <ArticleSkeleton /> : layout === 'faq' ? <FaqSkeleton /> : layout === 'designer' || layout === 'customizer' ? <DesignerSkeleton customizer={layout === 'customizer'} /> : layout === 'form' ? <div className="mx-auto max-w-xl space-y-6 rounded-2xl border bg-card p-5 sm:p-8"><SkeletonBlock className="h-8 w-3/4" /><SkeletonLines count={2} /><SkeletonFields count={2} multiline={false} /></div> : layout === 'checkout' ? <><SkeletonBlock className="h-9 w-64 max-w-full" /><div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)]"><div className="space-y-6 rounded-2xl border bg-card p-5"><SkeletonBlock className="h-6 w-40" /><SkeletonFields count={5} multiline={false} /></div><SummarySkeleton /></div></> : layout === 'contact' ? <><SkeletonHero /><div className="grid gap-7 lg:grid-cols-2"><div className="space-y-5">{[0, 1, 2].map(item => <div key={item} className="space-y-4 rounded-xl border p-5"><SkeletonBlock className="h-6 w-36" /><SkeletonLines count={2} /></div>)}</div><div className="rounded-2xl border bg-card p-5 sm:p-7"><SkeletonFields /></div></div></> : layout === 'order' ? <div className="mx-auto max-w-4xl space-y-6"><div className="flex flex-col items-center gap-4"><SkeletonBlock className="size-14 rounded-full" /><SkeletonBlock className="h-8 w-2/3" /><SkeletonBlock className="h-4 w-1/2" /></div><SummarySkeleton /><div className="grid gap-5 sm:grid-cols-2">{[0, 1].map(item => <div key={item} className="space-y-4 rounded-xl border p-5"><SkeletonBlock className="h-6 w-32" /><SkeletonLines /></div>)}</div></div> : layout === 'account' ? <><SkeletonBlock className="h-9 w-2/3" /><div className="flex gap-3">{[0, 1, 2].map(item => <SkeletonBlock key={item} className="h-11 w-1/3" />)}</div><div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map(item => <SkeletonBlock key={item} className="h-28" />)}</div><SummarySkeleton /></> : <>
      <SkeletonHero image={layout !== 'size-guide'} />
      {layout === 'size-guide' ? <><div className="flex flex-wrap gap-3">{[0, 1, 2, 3].map(item => <SkeletonBlock key={item} className="h-11 w-28" />)}</div><div className="overflow-hidden rounded-xl border bg-card">{Array.from({ length: 7 }, (_, row) => <div key={row} className="grid grid-cols-5 gap-3 border-b p-3 sm:p-5">{[0, 1, 2, 3, 4].map(cell => <SkeletonBlock key={cell} className="h-5" />)}</div>)}</div><div className="grid gap-5 sm:grid-cols-2"><SkeletonBlock className="aspect-[4/3]" /><SkeletonBlock className="aspect-[4/3]" /></div></> : <><div className={`grid gap-5 ${layout === 'guide' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>{[0, 1, 2, ...(layout === 'guide' ? [3] : [])].map(item => <div key={item} className="space-y-4 rounded-xl border bg-card p-5">{layout === 'gallery' && <SkeletonBlock className="aspect-[4/3]" />}<SkeletonBlock className="h-6 w-3/4" /><SkeletonLines /></div>)}</div><div className="grid items-start gap-7 lg:grid-cols-2"><SkeletonBlock className="aspect-[4/3]" /><div className="space-y-5"><SkeletonBlock className="h-7 w-3/4" />{layout === 'landing' ? <SkeletonFields count={3} /> : <><SkeletonLines count={5} /><SkeletonLines count={4} /></>}</div></div></>}
    </>}
  </div>
}
