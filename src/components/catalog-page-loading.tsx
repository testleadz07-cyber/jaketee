import Link from 'next/link'
import Image from '@/components/optimized-image'
import { Header } from '@/components/header'

function Placeholder({ className }: { className: string }) {
  return <div className={`rounded-lg bg-muted motion-safe:animate-pulse ${className}`} />
}

/** Only use after the route has been identified as a collection or product. */
export function CatalogPageLoading({ kind, title, description, image }: {
  kind: 'collection' | 'product'
  title: string
  description?: string
  image?: string
}) {
  return <div className="min-h-screen bg-background text-foreground">
    <Header />
    <main className="section-shell py-6! md:py-8!">
      <nav aria-label="Breadcrumb" className="mb-5 flex min-w-0 items-center gap-2 text-xs text-muted-foreground"><Link href="/" className="shrink-0 underline underline-offset-4">Home</Link><span aria-hidden="true">/</span><span className="truncate">{title}</span></nav>
      {kind === 'collection' ? <>
        <div className="mb-7 max-w-3xl"><p className="text-xs font-semibold uppercase tracking-wider text-primary">Jacketee collection</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>{description && <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>}</div>
        <div className="mb-5 flex min-h-12 items-center border-y py-3"><LoadingStatus label="Loading products…" /></div>
        <div aria-hidden="true" className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{[0, 1, 2, 3].map(item => <div key={item} className="min-w-0 space-y-3 rounded-xl border bg-card p-3"><Placeholder className="aspect-square" /><Placeholder className="h-4 w-4/5" /><Placeholder className="h-4 w-20" /></div>)}</div>
      </> : <div className="grid items-start gap-6 md:grid-cols-2 md:gap-10">
        <div className="relative aspect-square overflow-hidden rounded-xl border bg-card">{image ? <Image src={image} alt={title} fill priority sizes="(max-width: 767px) 100vw, 50vw" className="object-contain p-4" /> : <Placeholder className="h-full w-full" />}</div>
        <div className="min-w-0"><h1 className="text-2xl font-bold leading-tight sm:text-3xl">{title}</h1><div className="my-5 border-y py-4"><LoadingStatus label="Loading product options…" /></div><div aria-hidden="true" className="space-y-4"><Placeholder className="h-5 w-28" /><Placeholder className="h-16 w-full" /><div className="flex gap-3">{[0, 1, 2, 3].map(item => <Placeholder key={item} className="h-10 w-10" />)}</div></div></div>
      </div>}
    </main>
  </div>
}

function LoadingStatus({ label }: { label: string }) {
  return <div role="status" aria-live="polite" className="flex items-center gap-2 text-xs text-muted-foreground"><span aria-hidden="true" className="size-3.5 shrink-0 rounded-full border-2 border-primary/25 border-t-primary motion-safe:animate-spin" />{label}</div>
}
