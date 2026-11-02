export const dynamic = 'force-dynamic'

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
          <div className="rounded-2xl bg-[#242623] px-6 py-7 text-white sm:px-9"><p className="text-xs font-semibold uppercase tracking-widest text-white/65">Measure. Compare. Check your fit.</p><h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Jacket &amp; Vest Size Guide</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">Not sure which size to order? Measure your chest and waist below, find a chart match, then check the fit of the jacket you want.</p><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2"><a href="#size-charts" className="inline-flex min-h-11 items-center rounded-lg bg-white px-4 text-sm font-semibold text-zinc-950">Find my size</a><a href="#how-to-measure" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">How to measure</a></div></div>
        </section>
        <nav aria-label="Size guide sections" className="border-y bg-background"><div className="section-shell flex gap-5 overflow-x-auto py-0! text-sm font-medium sm:gap-8">{[{ href: '#size-charts', label: 'Size charts' }, { href: '#how-to-measure', label: 'Measuring' }, { href: '#fit-advice', label: 'Fit advice' }, { href: '#size-guide-faq-heading', label: 'FAQs' }].map(item => <a key={item.href} href={item.href} className="inline-flex min-h-12 shrink-0 items-center hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">{item.label}</a>)}</div></nav>

        <JacketSizeReference />

        <section className="section-shell py-8! md:py-10!" aria-labelledby="product-measurements-heading">
          <div className="rounded-2xl border bg-card p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Before you order</p>
            <h2 id="product-measurements-heading" className="mt-2 scroll-mt-24 text-2xl font-semibold">2. Check how your chosen jacket will fit</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Use a jacket or vest that already fits you well. Close it, lay it flat, and compare these measurements with the style you want to buy.</p>
            <ol className="mt-6 grid min-w-0 gap-4 md:grid-cols-3">
              {[
                { title: 'Chest width', text: 'Measure straight across from armpit to armpit. Compare flat width with flat width, using the same unit.', href: '#jacket-size-chart', label: 'View garment chart' },
                { title: 'Back length', text: 'Measure from the base of the collar to the bottom hem. Check whether the new style will sit where you like.', href: '#measure-back', label: 'See measuring steps' },
                { title: 'Sleeve length', text: 'For jackets, measure from the shoulder seam to the end of the cuff. Skip this step for vests.', href: '#measure-sleeve', label: 'See measuring steps' },
              ].map((item, index) => <li key={item.title} className="flex min-w-0 flex-col rounded-xl border bg-background p-4 sm:p-5">
                <div className="flex items-center gap-3"><span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">{index + 1}</span><h3 className="font-semibold">{item.title}</h3></div>
                <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
                <a href={item.href} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4">{item.label}<ArrowRight aria-hidden="true" className="size-4 shrink-0" /></a>
              </li>)}
            </ol>
            <p className="mt-5 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Wearing layers?</strong> Compare a garment that fits comfortably over the layers you plan to wear.</p>
            <div className="mt-6 flex min-w-0 flex-col gap-4 border-t pt-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0"><h3 className="font-semibold">Ready to compare your chosen style?</h3><SizeGuideReturnLink /></div>
              <div className="min-w-0 lg:max-w-md"><p className="text-sm leading-6 text-muted-foreground">Missing product measurements? Send us the product name, your chest and waist measurements, and preferred fit.</p><Button asChild className="mt-3 min-h-11 w-full sm:w-auto"><Link href="/contact">Ask us to check the fit<ArrowRight aria-hidden="true" className="ml-2 size-4" /></Link></Button></div>
            </div>
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
