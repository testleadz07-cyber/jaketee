import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function CustomizeLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          <div className="mb-6 h-5 w-72 animate-pulse rounded bg-muted" />
          <div className="mb-5 h-5 w-40 animate-pulse rounded bg-muted" />

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
            <aside className="space-y-4 lg:sticky lg:top-24">
              <div className="aspect-square animate-pulse rounded-lg bg-muted" />
              <div className="grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="aspect-square animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
              <div className="rounded-md border bg-muted/30 p-4">
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-7 w-2/3 animate-pulse rounded bg-muted" />
                <div className="mt-4 h-9 w-32 animate-pulse rounded bg-muted" />
              </div>
            </aside>

            <section className="space-y-5">
              <div>
                <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-9 w-72 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-5 w-full max-w-xl animate-pulse rounded bg-muted" />
              </div>

              <div className="space-y-4 rounded-md border bg-card p-4">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="flex gap-3">
                  <div className="h-14 flex-1 animate-pulse rounded-md bg-muted" />
                  <div className="h-14 flex-1 animate-pulse rounded-md bg-muted" />
                  <div className="h-14 w-14 animate-pulse rounded-xl bg-muted" />
                </div>
                <div className="border-t pt-4">
                  <div className="h-[420px] animate-pulse rounded-lg bg-muted" />
                  <div className="mt-4 h-5 w-48 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
