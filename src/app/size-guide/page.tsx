import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { JacketSizeReference } from '@/components/jacket-size-reference'
import { SizeGuideResources } from '@/components/size-guide-resources'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'

export const metadata: Metadata = {
  title: 'Jacket Size Guide | Jacketee',
  description: 'Measure your chest, waist, sleeve, and jacket length. Compare reference body and garment measurements, then confirm the fit for your Jacketee style.',
  alternates: { canonical: `${SITE_URL}/size-guide` },
  openGraph: {
    title: 'Jacket Size Guide | Jacketee',
    description: 'A practical measurement guide for choosing a custom jacket size.',
    url: `${SITE_URL}/size-guide`,
    siteName: 'Jacketee',
    type: 'website',
  },
}

export default function SizeGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="border-b bg-zinc-950 text-white">
          <div className="container mx-auto px-4 py-10 md:py-14">
            <Breadcrumbs items={[{ label: 'Size Guide' }]} className="mb-6 text-white/70" />
            <h1 className="text-3xl font-bold md:text-5xl">Jacket Size Guide</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
              Measure your body, compare a jacket you already own, and check the exact fit of the style you plan to order.
            </p>
          </div>
        </section>

        <nav aria-label="Size guide sections" className="border-b bg-background">
          <div className="container mx-auto grid grid-cols-2 px-4 text-sm font-medium sm:flex sm:flex-wrap sm:gap-8">
            {[
              { href: '#find-your-fit', label: 'Find your fit' },
              { href: '#body-size-chart', label: 'Body chart' },
              { href: '#jacket-size-chart', label: 'Jacket chart' },
              { href: '#how-to-measure', label: 'How to measure' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="border-b px-1 py-4 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring sm:border-b-0 sm:px-0">
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <JacketSizeReference />
        <SizeGuideResources />

        <section className="border-t bg-zinc-950 text-white">
          <div className="container mx-auto flex flex-col gap-5 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold">Need measurements for a specific jacket?</h2>
              <p className="mt-2 text-sm text-white/70">Send us the product name and your body measurements before you order.</p>
            </div>
            <Button asChild className="w-fit shrink-0 bg-white text-black hover:bg-white/90"><Link href="/contact">Ask about sizing <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
