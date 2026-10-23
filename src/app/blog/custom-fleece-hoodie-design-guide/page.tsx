import { withSocialMetadata } from '@/lib/seo-metadata'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

const title = 'How to Design Your Own Fleece Hoodie | Jacketee'
const description = 'Plan a custom fleece hoodie with pullover or full-zip construction, fleece weight, fit, hood lining, pockets, and personalized artwork.'
const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'}/blog/custom-fleece-hoodie-design-guide`
export const metadata: Metadata = withSocialMetadata({ title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: 'article' } })

export default function HoodieGuide() {
  const schema = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: title, description, mainEntityOfPage: url, author: { '@type': 'Organization', name: 'Jacketee' } }
  return <div className="flex min-h-screen flex-col"><Header /><main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground"><Link href="/">Home</Link> / <Link href="/blog">Blog</Link> / Fleece hoodie design guide</nav>
    <article className="space-y-8 leading-7"><header><h1 className="text-3xl font-bold sm:text-4xl">How to design your own fleece hoodie</h1><p className="mt-4 text-muted-foreground">Start with a cotton fleece template, choose the construction, and coordinate colors before adding your text or artwork. The hoodie designer shows the front, back, and each sleeve without selecting a catalog product first.</p></header>
      <section><h2 className="mb-3 text-xl font-semibold">Choose pullover or full-zip</h2><p>A pullover gives you an uninterrupted chest area and an optional kangaroo pocket. A full-zip hoodie opens at the center and uses split pockets. Switching styles updates the pocket construction automatically; choose No pockets if you prefer a plain front.</p></section>
      <section><h2 className="mb-3 text-xl font-semibold">Choose fleece weight and fit</h2><p>Select lightweight, midweight, or heavyweight fleece and a regular or relaxed fit. Relaxed adds fullness to the preview’s body and sleeves. The preview illustrates construction and texture; it does not specify a fabric weight in GSM or an insulation rating. <Link href="/contact" className="underline">Contact us</Link> to confirm fabric specifications and hoodie measurements before ordering.</p></section>
      <section><h2 className="mb-3 text-xl font-semibold">Set the hood, cuffs, and sleeve details</h2><p>An attached hood, ribbed cuffs, and a ribbed waistband are included. Choose matching fleece or jersey hood lining, add or remove drawstrings, and compare set-in and raglan sleeves. Color the hood outside and lining separately, with a single sleeve color applied to both sleeves.</p></section>
      <section><h2 className="mb-3 text-xl font-semibold">Keep artwork clear of openings</h2><p>Use chest artwork above the kangaroo pocket on a pullover. On full-zip hoodies, place logos to either side of the center zipper and keep pocket openings clear. Switching construction does not move existing artwork, so review all views again after a style change. The text editor supports straight, curved, and stacked vertical layouts, with Undo and Redo available as you work.</p><p className="mt-3">Read the <Link href="/patches-embroidery" className="underline">patches and embroidery guide</Link> for decoration options, and check the <Link href="/size-guide" className="underline">size guide</Link> before selecting a size.</p></section>
      <section><h2 className="mb-3 text-xl font-semibold">Check your price and save your design</h2><p>The pullover base is $55 USD including the hood. Full-zip adds $2. There are no additional charges for the offered fleece weights, fit, hood lining, drawstrings, pocket styles, or sleeve construction. Text and artwork fees appear in the total. Shipping is calculated at checkout.</p><p className="mt-3">Save design keeps a draft in this browser on this device. Download design exports a JSON file with the configuration and four previews; importing it is not currently supported.</p></section>
      <div className="flex flex-wrap gap-3"><Link href="/design/hoodie" className="rounded-md bg-zinc-900 px-5 py-3 font-semibold text-white hover:bg-zinc-800">Design your fleece hoodie</Link><Link href="/custom-hoodies" className="rounded-md border px-5 py-3 font-semibold hover:bg-muted">Explore custom hoodies</Link></div>
    </article>
  </main><Footer /></div>
}
