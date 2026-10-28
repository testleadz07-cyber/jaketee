import { withSocialMetadata } from '@/lib/seo-metadata'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { JacketSizeReference } from '@/components/jacket-size-reference'
import { SizeGuideResources } from '@/components/size-guide-resources'
import { SizeGuideReturnLink } from '@/components/browsing-context'

export const revalidate = 300

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'

export const metadata: Metadata = withSocialMetadata({
  title: 'Jacket & Vest Size Guide | Jacketee',
  description: 'Measure your chest, waist, sleeve, and jacket length. Compare reference body and garment measurements, then confirm the fit for your Jacketee style.',
  alternates: { canonical: `${SITE_URL}/size-guide` },
  openGraph: {
    title: 'Jacket & Vest Size Guide | Jacketee',
    description: 'A practical measurement guide for choosing a custom jacket size.',
    url: `${SITE_URL}/size-guide`,
    siteName: 'Jacketee',
    type: 'website',
  },
})

export default function SizeGuidePage() {
  return (
    <div className="category-page min-h-screen bg-background">
      <Header home />
      <main>
        <section className="section-shell py-6! md:py-8!">
          <SizeGuideReturnLink />
          <Breadcrumbs items={[{ label: 'Size Guide' }]} className="mb-5" />
          <div className="rounded-2xl bg-[#242623] px-6 py-7 text-white sm:px-9"><p className="text-xs font-semibold uppercase tracking-widest text-white/65">A little measuring. A better starting point.</p><h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Jacket &amp; Vest Size Guide</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">Measure your body or compare a garment you already own. Use the reference charts below, then confirm the dimensions of the exact style you plan to order.</p><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2"><a href="#size-charts" className="inline-flex min-h-11 items-center rounded-lg bg-white px-4 text-sm font-semibold text-zinc-950">View size charts</a><a href="#how-to-measure" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">How to measure</a></div></div>
        </section>
        <nav aria-label="Size guide sections" className="border-y bg-background"><div className="section-shell flex gap-5 overflow-x-auto py-0! text-sm font-medium sm:gap-8">{[{ href: '#size-charts', label: 'Size charts' }, { href: '#how-to-measure', label: 'Measuring' }, { href: '#fit-advice', label: 'Fit advice' }, { href: '#size-guide-faq-heading', label: 'FAQs' }].map(item => <a key={item.href} href={item.href} className="inline-flex min-h-12 shrink-0 items-center hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">{item.label}</a>)}</div></nav>

        <JacketSizeReference />

        <section className="section-shell py-8! md:py-10!" aria-labelledby="product-measurements-heading">
          <h2 id="product-measurements-heading" className="text-2xl font-semibold">Check the measurements for your chosen style</h2>
          <div className="mt-4 max-w-3xl space-y-3 text-sm leading-7 text-muted-foreground">
            <p>Use this guide to prepare your measurements, then compare them with the exact jacket you intend to order. A size label alone does not establish the same fit across varsity, bomber, coach and puffer styles.</p>
            <p>Body chest circumference and flat jacket chest width are different measurements. Follow the measuring method shown for the relevant chart, and include the layers you expect to wear.</p>
            <p>If a product does not show its finished measurements, <Link href="/contact" className="font-medium underline underline-offset-4">contact the team</Link> with the product name and your measurements before confirming the size.</p>
          </div>
        </section>

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
