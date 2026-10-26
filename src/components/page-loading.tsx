import { Header } from '@/components/header'

export function PageLoading({ label, storefront = true }: { label: string; storefront?: boolean }) {
  return <div className="min-h-screen bg-background text-foreground">
    {storefront && <Header />}
    <main className="section-shell py-8!">
      <div role="status" aria-live="polite" className="loading-feedback flex items-center gap-3 rounded-xl border bg-card px-4 py-4 text-sm text-card-foreground">
        <span aria-hidden="true" className="size-4 shrink-0 animate-spin rounded-full border-2 border-primary/25 border-t-primary motion-reduce:animate-none" />
        {label}
      </div>
    </main>
  </div>
}
