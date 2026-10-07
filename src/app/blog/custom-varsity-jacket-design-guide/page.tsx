import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const title = 'How to Design Your Own Varsity Jacket | Jacketee'
const description = 'Plan a custom varsity jacket: choose body and sleeve materials, coordinate colors, select your collar and closure, and position text and artwork.'
const url = `${SITE_URL}/blog/custom-varsity-jacket-design-guide`

export const metadata: Metadata = {
  title, description, alternates: { canonical: url },
  openGraph: { title, description, url, type: 'article' },
}

export default function VarsityDesignGuide() {
  const schema = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: title, description, mainEntityOfPage: url, author: { '@type': 'Organization', name: 'Jacketee', url: SITE_URL } }
  return <div className="flex min-h-screen flex-col"><Header /><main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground"><Link href="/">Home</Link> / <Link href="/blog">Blog</Link> / Varsity design guide</nav>
    <article className="space-y-8 leading-7">
      <header><p className="text-sm text-muted-foreground">Jacketee · Customization guide</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">How to design your own varsity jacket</h1><p className="mt-5 text-muted-foreground">A varsity jacket brings your colors, initials, and artwork together. Start with a simple color combination, then build the details around it. Our designer lets you preview your choices without selecting a catalog product first.</p></header>
      <section><h2 className="mb-3 text-xl font-semibold">1. Choose your body and sleeve materials</h2><p>The designer offers wool, cotton fleece, and satin for the body, with leather also available for sleeves. A contrasting body and sleeve combination is a familiar varsity look; matching materials create a more consistent finish. Read our <Link href="/materials-colors" className="underline">materials and colors guide</Link> before deciding. Preview textures illustrate the choices rather than reproducing the fabric exactly.</p></section>
      <section><h2 className="mb-3 text-xl font-semibold">2. Keep your colors coordinated</h2><p>Choose one main body color and one shared sleeve color. Then coordinate the collar, cuffs, waistband, pockets, and knit stripes. For a school or team design, use your main team color on the body and a lighter contrast on the sleeves. Check how lettering reads against the fabric color before adding more accents.</p></section>
      <section><h2 className="mb-3 text-xl font-semibold">3. Set the construction details</h2><p>Compare set-in and raglan sleeves, choose your collar, and decide whether you want a hood. Pick buttons or a zipper, then set pockets, lining, and knit stripes. Change one option at a time so you can see its effect on the preview.</p></section>
      <section><h2 className="mb-3 text-xl font-semibold">4. Add names, letters, and artwork</h2><p>Try initials or a small logo on the chest, a larger design on the back, and smaller accents on the sleeves. Use the artwork library or upload a PNG, JPG, or WebP image under 5 MB. Drag the artwork into position and review the front, back, and both sleeve views. Our <Link href="/patches-embroidery" className="underline">patches and embroidery guide</Link> explains the available decoration options.</p></section>
      <section><h2 className="mb-3 text-xl font-semibold">5. Check your size, price, and saved design</h2><p>Use the <Link href="/size-guide" className="underline">size guide</Link> before selecting your size. The cotton fleece base costs $55 USD; a material upgrade adds $10 once per jacket, a hood adds $5, and a zipper adds $2. Artwork and embroidery fees appear in the total, with shipping calculated at checkout.</p><p className="mt-3">Save design keeps a draft in the same browser on this device. Download design exports a JSON file with your configuration and four previews; it cannot currently be imported back into the designer.</p></section>
      <section className="rounded-xl border bg-muted/30 p-6"><h2 className="text-xl font-semibold">Ready to try your design?</h2><p className="mt-3">Start from the varsity template, or choose a catalog product and use its customization button to work with that specific jacket.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/design/varsity" className="rounded-md bg-zinc-900 px-5 py-3 font-semibold text-white hover:bg-zinc-800">Design your varsity jacket</Link><Link href="/shop" className="rounded-md border px-5 py-3 font-semibold hover:bg-muted">Choose a product</Link></div></section>
    </article>
  </main><Footer /></div>
}
