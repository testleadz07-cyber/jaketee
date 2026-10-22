import Link from 'next/link'
import { ArrowRight, Check, ChevronDown, ClipboardCheck, Palette, Truck } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { BulkQuoteForm } from '@/components/bulk-quote-form'
import { BulkQuoteShortcut } from '@/components/bulk-quote-shortcut'
import { BlogCard } from '@/components/blog-card'
import { ProductCard } from '@/components/product-card'
import { CollectionDesignImage } from '@/components/collection-design-image'
import { getCustomLandingProducts } from '@/components/custom-jacket-landing-page'
import { bulkPrograms, type BulkProgramKey } from '@/data/bulk-programs'
import designImages from '@/data/custom-design-images.json'
import { fulfillmentConfig } from '@/config/fulfillment'
import { buildProductUrl } from '@/lib/categories'

const stages = [
  { icon: ClipboardCheck, title: 'Share your brief', text: 'Start with your quantity, style, destination and target date. A rough idea is welcome.' },
  { icon: Palette, title: 'Review quote & proof', text: 'Confirm materials, artwork, names, sizes and pricing before approving production.' },
  { icon: Truck, title: 'Production & delivery', text: 'The approved order moves through materials, decoration, sewing, quality checks and shipping.' },
]

export async function BulkProgramPage({ kind = 'all' }: { kind?: BulkProgramKey }) {
  const program = bulkPrograms[kind]
  const products = (await getCustomLandingProducts(kind === 'corporate' ? 'bomber-jackets' : 'varsity-jackets')).slice(0, 3)
  const hero = designImages.find(image => image.key === program.imageKey) || designImages[0]
  const site = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
  const schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', name: program.title, description: program.intro, url: `${site}${program.path}`, mainEntity: { '@type': 'ItemList', numberOfItems: products.length, itemListElement: products.map((product, index) => ({ '@type': 'ListItem', position: index + 1, name: product.name, url: `${site}${buildProductUrl(product)}` })) } },
    { '@type': 'FAQPage', mainEntity: program.faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: site }, { '@type': 'ListItem', position: 2, name: 'Bulk & Teams', item: `${site}/bulk-orders` }, ...(kind === 'all' ? [] : [{ '@type': 'ListItem', position: 3, name: program.label, item: `${site}${program.path}` }])] },
  ] }
  return (
    <div className="category-page flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
        <section id="bulk-hero" className="section-shell py-6! md:py-8!">
          <Breadcrumbs items={kind === 'all' ? [{ label: 'Bulk & Teams' }] : [{ label: 'Bulk & Teams', href: '/bulk-orders' }, { label: program.label }]} className="mb-5" />
          <div className="grid overflow-hidden rounded-2xl border bg-[#242b30] text-white lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Jacketee · {program.label}</p>
              <h1 className="mt-4 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl xl:text-5xl">{program.title}</h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 sm:text-base">{program.intro}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="#bulk-quote" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-white px-5 text-sm font-semibold text-zinc-950 hover:bg-white/90">Request a Free Bulk Quote <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
                <Link href="/design/varsity" className="inline-flex min-h-12 items-center justify-center px-2 text-sm font-semibold text-white underline underline-offset-4">Build Your Jacket</Link>
              </div>
              <p className="mt-4 text-xs leading-5 text-white/65">Bulk quote requests: 10+ jackets. <Link href="/contact" className="underline underline-offset-4">Fewer than 10? Talk to us.</Link></p>
            </div>
            <div className="relative min-h-64 bg-[#f2eee8] sm:min-h-80 lg:min-h-[440px]">
              <CollectionDesignImage urls={[hero.url, ...products.flatMap(product => product.images?.[0]?.url ? [product.images[0].url] : [])]} alt={hero.alt} priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-contain p-6 sm:p-10" />
              <span className="absolute bottom-4 left-4 rounded-full border bg-white/90 px-3 py-2 text-xs font-medium text-zinc-800">Customization example · your design is reviewed separately</span>
            </div>
          </div>
          <div className="mt-4 grid divide-y rounded-xl border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[['10+ jackets', 'Start with an estimated quantity'], ['3–4 weeks typical', 'Project timing confirmed before ordering'], ['Proof before production', 'Review your artwork and order details']].map(([title, text]) => <div key={title} className="flex gap-3 p-4"><Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></div></div>)}
          </div>
        </section>

        <section className="section-shell py-7! md:py-10!" aria-labelledby="bulk-programs-heading">
          <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Find your program</p><h2 id="bulk-programs-heading" className="mt-2 text-2xl font-semibold tracking-tight">Made for your people.</h2></div>
          <nav aria-label="Bulk jacket programs" className="grid gap-3 sm:grid-cols-3">
            {(['schools', 'corporate', 'private-label'] as const).map(key => <Link key={key} href={bulkPrograms[key].path} aria-current={kind === key ? 'page' : undefined} className={`flex items-center justify-between gap-3 rounded-xl border p-5 transition-colors hover:border-primary ${kind === key ? 'border-primary bg-primary/5' : 'bg-card'}`}><span><span className="block text-base font-semibold">{bulkPrograms[key].label}</span><span className="mt-2 block text-sm text-muted-foreground">{key === 'schools' ? 'School colors, names & team pride' : key === 'corporate' ? 'Logo jackets for staff & events' : 'Labels, samples & collection planning'}</span></span><ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link>)}
          </nav>
          <nav aria-label="Specialist group programs" className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1">{(['senior-class', 'sorority-fraternity', 'cheer'] as const).map(key => <Link key={key} href={bulkPrograms[key].path} aria-current={kind === key ? 'page' : undefined} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline underline-offset-4">{bulkPrograms[key].label}<ArrowRight aria-hidden="true" className="h-3 w-3" /></Link>)}</nav>
        </section>

        {products.length > 0 && <section className="section-shell py-7! md:py-10!" aria-labelledby="bulk-examples-heading"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Choose a starting style</p><h2 id="bulk-examples-heading" className="mt-2 text-2xl font-semibold tracking-tight">A jacket to build on.</h2><p className="mt-2 text-sm text-muted-foreground">Current catalog styles. Listed prices are individual product prices; your bulk quote is calculated separately.</p></div><Link href="/shop" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4">Shop all jackets <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{products.map(product => <ProductCard key={product.id} product={product} />)}</div></section>}

        <section className="border-y bg-muted/25"><div className="section-shell py-8! md:py-10!"><h2 className="text-2xl font-semibold tracking-tight">From your first idea to the whole group.</h2><ol className="mt-6 grid gap-6 md:grid-cols-3">{stages.map(({ icon: Icon, title, text }, index) => <li key={title} className="border-l-2 border-primary/25 pl-5"><span className="flex items-center gap-3 text-xs font-semibold text-primary"><Icon aria-hidden="true" className="h-5 w-5" />0{index + 1}</span><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></li>)}</ol></div></section>

        <section id="bulk-quote" className="scroll-mt-24"><div className="section-shell grid gap-7 py-10! lg:grid-cols-[0.7fr_1.3fr] lg:gap-12 md:py-14!"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Let’s plan your order</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Your group. Your details.</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">Request a free quote for {kind === 'all' ? 'your bulk custom jackets' : program.label.toLowerCase()}. You can start without finished artwork or a final roster.</p><ul className="mt-5 space-y-3 text-sm">{['An estimate of 10 or more jackets', 'Your preferred style, or ask for advice', 'Delivery country and your target date'].map(text => <li key={text} className="flex gap-3"><Check aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />{text}</li>)}</ul><div className="mt-6 rounded-xl border bg-muted/30 p-5"><h3 className="text-sm font-semibold">What happens next?</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">The team contacts you by email to discuss specifications and timing. Requesting a quote does not commit you to an order.</p></div></div><div className="min-w-0 rounded-2xl border bg-card p-5 sm:p-7"><h3 className="text-xl font-semibold">Request a Free Bulk Quote</h3><p className="mt-2 text-sm text-muted-foreground">For 10+ jackets. Fields marked * are required.</p><BulkQuoteForm program={kind === 'all' ? '' : program.label} /></div></div></section>

        <section className="border-y bg-muted/20"><div className="section-shell grid gap-7 py-8! lg:grid-cols-[0.65fr_1.35fr] md:py-12!"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Before you approve</p><h2 className="mt-3 text-2xl font-semibold tracking-tight">The details that make the difference.</h2><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">{[['Materials & colors', '/materials-colors'], ['Patches & embroidery', '/patches-embroidery'], ['Size guide', '/size-guide']].map(([label, href]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">{label}</Link>)}</div></div><div className="divide-y border-y">{program.details.map((detail, index) => <details key={detail.title} open={index === 0} className="group py-4"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">{detail.title}<ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" /></summary><p className="mt-2 text-sm leading-7 text-muted-foreground">{detail.text}</p></details>)}<details className="group py-4"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">Production & shipping estimates<ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" /></summary><p className="mt-2 text-sm leading-7 text-muted-foreground">{fulfillmentConfig.bulkProductionDelivery} Samples, approvals, materials and customs can extend the schedule. Confirm bulk shipping charges and any import duties for your destination in the project quote.</p><Link href="/shipping" className="mt-2 inline-flex min-h-11 items-center text-sm underline underline-offset-4">Shipping information</Link></details></div></div></section>

        <section className="section-shell py-10! md:py-12!" aria-labelledby="bulk-faq-heading"><div className="mx-auto max-w-4xl"><h2 id="bulk-faq-heading" className="text-2xl font-semibold tracking-tight">Questions about {kind === 'all' ? 'bulk jacket orders' : program.label.toLowerCase()}</h2><div className="mt-5 divide-y border-y">{program.faqs.map(faq => <details key={faq.question} className="group py-4"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">{faq.question}<ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" /></summary><p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">{faq.answer}</p></details>)}</div></div></section>
        <section className="border-t bg-muted/20"><div className="section-shell py-8! md:py-10!"><h2 className="text-2xl font-semibold tracking-tight">Helpful guides for your order</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{program.guides.slice(0, 3).map(guide => <BlogCard key={guide.slug} article={{ ...guide, excerpt: '' }} />)}</div></div></section>
        <BulkQuoteShortcut />
      </main>
      <Footer />
    </div>
  )
}
