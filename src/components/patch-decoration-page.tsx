import Link from 'next/link'
import { ArrowRight, Check, ChevronDown, FileCheck2, Palette, Ruler } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { CollectionDesignImage } from '@/components/collection-design-image'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { CustomDesignSection } from '@/components/custom-design-section'
import { PatchPlacementGuide } from '@/components/patch-placement-guide'
import { WhatsAppButton } from '@/components/whatsapp-help'
import { getCategoryHeroDescription } from '@/data/category-hero-copy'
import { placements, faqs, type ImageItem, type Method } from '@/data/patch-decoration'

export const decorationGroups = [
  { id: 'patches', title: 'Patches & appliqué', text: 'Separate pieces and layered fabrics that add texture, shape and identity.', methods: ['chenille-patches', 'felt-patches', 'embroidered-patches', 'woven-patches', 'leather-patches', 'tackle-twill'] },
  { id: 'embroidery', title: 'Direct embroidery', text: 'Thread or yarn stitched directly into the garment, with suitable backing and fabric.', methods: ['digitizing-embroidery', 'chenille-embroidery', 'puff-embroidery'] },
  { id: 'printing', title: 'Printing & transfers', text: 'Colorful artwork and graphic finishes, selected to suit your fabric and design.', methods: ['dtf-printing', 'screen-printing', 'htv-vinyl', 'sublimation-printing'] },
  { id: 'labels', title: 'Brand labels', text: 'The finishing details for necks, hems, linings and branded collections.', methods: ['woven-labels'] },
]

const shortcuts = [
  { title: 'Classic varsity letters', text: 'Soft, raised texture', method: 'chenille-patches' },
  { title: 'Names & small logos', text: 'Thread stitched into fabric', method: 'digitizing-embroidery' },
  { title: 'Fine logo details', text: 'A flatter woven finish', method: 'woven-patches' },
  { title: 'Full-color artwork', text: 'Explore print options', method: 'dtf-printing' },
  { title: 'Your brand label', text: 'Neck, hem or lining details', method: 'woven-labels' },
]

const comparison = [
  ['Chenille patches', 'Soft & raised', 'Bold letters and simple mascots', 'Fine text and narrow outlines need another method.', 'chenille-patches'],
  ['Embroidered patches', 'Textured thread', 'Logos and defined shapes', 'Very small details may need simplifying.', 'embroidered-patches'],
  ['Woven patches', 'Flat & detailed', 'Fine lines and smaller lettering', 'Less raised texture than chenille or embroidery.', 'woven-patches'],
  ['Direct embroidery', 'Stitched into fabric', 'Names and compact logos', 'Fabric, backing and stitch density matter.', 'digitizing-embroidery'],
  ['Tackle twill', 'Crisp fabric layers', 'Large numbers and bold lettering', 'Not the first choice for intricate small artwork.', 'tackle-twill'],
  ['Printing', 'Graphic finish', 'Colorful designs and larger graphics', 'Technique depends on fabric and artwork; sublimation needs suitable polyester.', 'printing'],
]

export function PatchDecorationPage({ hero, heroFallback, placements: placementImages, methods, faqJsonLd }: {
  hero: { url: string; alt: string }
  heroFallback: string
  placements: ImageItem[]
  methods: Method[]
  faqJsonLd: object
}) {
  return (
    <div className="category-page flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }} />
        <section className="section-shell py-6! md:py-8!">
          <Breadcrumbs items={[{ label: 'Patches & Embroidery' }]} className="mb-5" />
          <div className="grid overflow-hidden rounded-2xl border bg-[#242b30] text-white lg:grid-cols-2">
            <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-11">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Patches, embroidery & finishing details</p>
              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl xl:text-5xl">Chenille Patches for Letterman Jackets</h1>
              <p className="mt-5 text-sm leading-7 text-white/80 sm:text-base">{getCategoryHeroDescription('/patches-embroidery', 'Patches & Embroidery')}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Link href="/design/varsity" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-white px-5 text-sm font-semibold text-zinc-950 hover:bg-white/90">Build Your Jacket<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link><Link href="/contact" className="inline-flex min-h-12 items-center justify-center px-2 text-sm font-semibold underline underline-offset-4">Ask About Decoration</Link></div>
              <p className="mt-4 text-xs leading-5 text-white/65">Choose the look first. We’ll review artwork, fabric and placement with you.</p>
            </div>
            <div className="relative min-h-64 bg-white sm:min-h-80 lg:min-h-[440px]"><CollectionDesignImage urls={[...new Set([hero.url, heroFallback])]} alt={hero.alt} priority sizes="(min-width: 1024px) 46vw, 100vw" className="object-contain p-4 sm:p-8" /></div>
          </div>
        </section>

        <nav aria-label="Decoration guide sections" className="border-y bg-background"><div className="section-shell flex gap-6 overflow-x-auto py-0!">{[['Choose a method', 'choose-method'], ['Compare options', 'compare-methods'], ['Explore all methods', 'decoration-methods'], ['Placement & sizes', 'placement-size-rules'], ['FAQs', 'faq']].map(([label, anchor]) => <a key={anchor} href={`#${anchor}`} className="inline-flex min-h-12 shrink-0 items-center text-sm font-medium hover:text-primary">{label}</a>)}</div></nav>

        <section id="choose-method" className="section-shell scroll-mt-24 py-8! md:py-12!" aria-labelledby="choose-method-heading">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Start with your artwork</p><h2 id="choose-method-heading" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">What would you like to add?</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">These are starting points, not fixed rules. Artwork detail, fabric and size determine the right decoration method.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">{shortcuts.map(shortcut => { const method = methods.find(item => item.id === shortcut.method)!; return <a key={shortcut.method} href={`#${shortcut.method}`} className="group overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary"><div className="relative aspect-[4/3] bg-white"><CollectionDesignImage urls={method.images.map(image => image.src)} alt={method.images[0].alt} sizes="(min-width: 1280px) 18vw, (min-width: 768px) 30vw, 45vw" className="object-contain p-3" /></div><div className="border-t p-3 sm:p-4"><h3 className="text-sm font-semibold">{shortcut.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{shortcut.text}</p><span className="mt-3 inline-flex min-h-8 items-center gap-2 text-xs font-semibold text-primary">Explore method<ArrowRight aria-hidden="true" className="h-3 w-3" /></span></div></a> })}</div>
        </section>

        <section id="compare-methods" className="scroll-mt-24 border-y bg-muted/20"><div className="section-shell py-8! md:py-12!"><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Compare the look. Find your fit.</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">A quick comparison of common choices. Explore every technique below for fabric and care details.</p>
          <div className="mt-5 grid gap-2 md:hidden">{comparison.map(([title, look, best, limitation, anchor]) => <Collapsible key={title} className="group rounded-xl border bg-card p-4"><CollapsibleTrigger className="w-full text-left flex min-h-11 cursor-pointer items-center justify-between gap-3"><span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs text-muted-foreground">{look}</span></span><ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" /></CollapsibleTrigger><CollapsibleContent forceMount className="data-[state=closed]:hidden"><dl className="mt-3 space-y-3 border-t pt-3 text-sm"><div><dt className="font-medium">Good starting point for</dt><dd className="text-muted-foreground">{best}</dd></div><div><dt className="font-medium">Consider</dt><dd className="text-muted-foreground">{limitation}</dd></div></dl><a href={`#${anchor}`} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4">Explore method<ArrowRight aria-hidden="true" className="h-3 w-3" /></a></CollapsibleContent></Collapsible>)}</div>
          <div className="mt-5 hidden overflow-hidden rounded-xl border md:block"><table className="w-full table-fixed text-left text-sm"><caption className="sr-only">Compare patch and embroidery finishes, common uses and limitations</caption><thead className="border-b bg-muted"><tr>{['Method', 'Finish', 'Good starting point for', 'Consider'].map(title => <th key={title} scope="col" className="p-4 font-semibold">{title}</th>)}</tr></thead><tbody>{comparison.map(([title, look, best, limitation, anchor]) => <tr key={title} className="border-b bg-card last:border-0"><th scope="row" className="p-4 font-medium"><a href={`#${anchor}`} className="inline-flex min-h-11 items-center underline underline-offset-4">{title}</a></th><td className="p-4 text-muted-foreground">{look}</td><td className="p-4 text-muted-foreground">{best}</td><td className="p-4 text-muted-foreground">{limitation}</td></tr>)}</tbody></table></div>
        </div></section>

        <section id="decoration-methods" className="section-shell scroll-mt-24 py-8! md:py-12!" aria-labelledby="decoration-methods-heading"><h2 id="decoration-methods-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">Explore patches, embroidery, printing & labels</h2><nav aria-label="Decoration method groups" className="mt-4 flex flex-wrap gap-2">{decorationGroups.map(group => <a key={group.id} href={`#${group.id}`} className="inline-flex min-h-11 items-center rounded-full border bg-card px-4 text-sm font-medium hover:border-primary">{group.title}</a>)}</nav>
          {decorationGroups.map(group => <section key={group.id} id={group.id} aria-labelledby={`${group.id}-heading`} className="scroll-mt-24 pt-8 md:pt-10"><div className="mb-5 border-t pt-6"><h3 id={`${group.id}-heading`} className="text-xl font-semibold">{group.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{group.text}</p></div><div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">{group.methods.map(methodId => { const method = methods.find(item => item.id === methodId)!; return <article key={method.id} id={method.id} className="scroll-mt-24 overflow-hidden rounded-2xl border bg-card"><div className="relative aspect-[4/3] bg-white"><CollectionDesignImage urls={method.images.map(image => image.src)} alt={method.images[0].alt} sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw" className="object-contain p-4" /></div><div className="border-t p-5"><h4 className="text-lg font-semibold leading-snug">{method.title}</h4>{method.badge && <p className="mt-2 text-xs font-medium text-primary">{method.badge}</p>}<p className="mt-3 text-sm leading-6 text-muted-foreground">{method.intro}</p><ul className="mt-4 space-y-2">{method.best.map(item => <li key={item} className="flex gap-2 text-xs leading-5 text-muted-foreground"><Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{item}</li>)}</ul>{method.note && <p className="mt-3 rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">{method.note}</p>}<Collapsible className="group mt-4 border-t"><CollapsibleTrigger className="w-full text-left flex min-h-12 cursor-pointer items-center justify-between gap-3 text-sm font-semibold">How it’s made, care & examples<ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" /></CollapsibleTrigger><CollapsibleContent forceMount className="data-[state=closed]:hidden"><div className="space-y-4 pb-2"><div><h5 className="text-sm font-semibold">{method.madeTitle}</h5><p className="mt-1 text-sm leading-6 text-muted-foreground">{method.made}</p></div><div><h5 className="text-sm font-semibold">Care considerations</h5><p className="mt-1 text-sm leading-6 text-muted-foreground">{method.care}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Follow the care instructions for the complete garment; fabric, lining and decoration can require different treatment.</p></div><div className="grid grid-cols-2 gap-2">{method.images.slice(1).map(image => <div key={image.src} className="relative aspect-square overflow-hidden rounded-lg border bg-white"><CollectionDesignImage urls={[image.src]} alt={image.alt} sizes="(min-width: 1280px) 14vw, (min-width: 768px) 22vw, 45vw" className="object-contain p-2" /></div>)}</div><Link href="/contact" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Ask about this method</Link></div></CollapsibleContent></Collapsible></div></article> })}</div></section>)}
        </section>

        <section id="placement-size-rules" className="scroll-mt-24 border-y bg-muted/20"><div className="section-shell py-8! md:py-12!"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Make room for your artwork</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Patch placement & sizes</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">Explore front, sleeve and back placement zones. Confirm dimensions for your jacket before approving artwork.</p><PatchPlacementGuide images={placementImages} placements={placements} /></div></section>

        <section className="section-shell py-8! md:py-12!" aria-labelledby="decoration-process-heading"><h2 id="decoration-process-heading" className="text-2xl font-semibold tracking-tight">From artwork to the finished detail.</h2><ol className="mt-6 grid gap-6 md:grid-cols-3">{[{ icon: Palette, title: 'Share your artwork', text: 'Send your logo, lettering or reference and tell us the jacket fabric and quantity.' }, { icon: Ruler, title: 'Review method & placement', text: 'Agree the finish, artwork size, colors and position. Pricing depends on the actual specification.' }, { icon: FileCheck2, title: 'Approve the design', text: 'Review spelling, scale and placement in the design proof before production.' }].map(({ icon: Icon, title, text }, index) => <li key={title} className="border-l-2 border-primary/25 pl-5"><span className="flex items-center gap-3 text-xs font-semibold text-primary"><Icon aria-hidden="true" className="h-5 w-5" />0{index + 1}</span><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{text}</p></li>)}</ol><div className="mt-7 flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">Not sure which method suits your artwork?</h3><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Tell us the fabric, approximate size, placement and quantity. The team can discuss suitable options.</p></div><WhatsAppButton message="I need help choosing patches or embroidery for a jacket. I’d like to discuss artwork, fabric, size and placement." /></div></section>

        <section id="faq" className="scroll-mt-24 border-t"><div className="section-shell grid gap-6 py-8! lg:grid-cols-[0.7fr_1.3fr] md:py-12!"><div><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Patches & embroidery FAQs</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Practical answers on choosing a finish, artwork, dimensions and garment care.</p></div><div className="divide-y border-y">{faqs.map(faq => <Collapsible key={faq.question} className="group py-4"><CollapsibleTrigger className="w-full text-left flex min-h-11 cursor-pointer items-center justify-between gap-4 text-sm font-semibold">{faq.question}<ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" /></CollapsibleTrigger><CollapsibleContent forceMount className="data-[state=closed]:hidden"><p className="mt-2 text-sm leading-7 text-muted-foreground">{faq.answer}</p></CollapsibleContent></Collapsible>)}</div></div></section>
        <CustomDesignSection categorySlugs={['patches-embroidery']} />
      </main>
      <Footer />
    </div>
  )
}
