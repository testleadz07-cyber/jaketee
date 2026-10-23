import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Image from '@/components/optimized-image'
import { CollectionDesignImage } from '@/components/collection-design-image'
import { getCustomDesignLink } from '@/lib/custom-design-links'
import savedImages from '@/data/custom-design-images.json'

export type CustomDesignImages = Record<string, { url: string; alt: string }>
const defaults: CustomDesignImages = Object.fromEntries(savedImages.map(image => [image.key, image]))
const designers = [{ key: 'varsity', label: 'Varsity', href: '/design/varsity' }, { key: 'bomber', label: 'Bomber', href: '/design/bomber' }, { key: 'puffer', label: 'Puffer', href: '/design/puffer' }]
export function CustomDesignCollection({ categorySlugs = [], categoryName, categoryImage, categoryImages = [], images = defaults }: { categorySlugs?: string[]; categoryName?: string; categoryImage?: string; categoryImages?: string[]; images?: CustomDesignImages }) {
  const all = categorySlugs.length === 0
  const link = getCustomDesignLink(categorySlugs)
  const decoration = categorySlugs.includes('patches-embroidery')
  const familyPreview = link.imageKey ? images[link.imageKey] || defaults[link.imageKey] : undefined
  const previewUrls = [...new Set([...categoryImages, ...(categoryImage ? [categoryImage] : []), ...(familyPreview?.url ? [familyPreview.url] : [])].filter(url => url?.trim()))]
  const previewAlt = categoryImages.length || categoryImage ? `${categoryName || 'Collection'} product example` : familyPreview?.alt || `${categoryName || 'Collection'} design example`
  const preview = previewUrls.length > 0
  const heading = all ? 'Design your own jacket' : link.title
  return <section className="store-section store-section--soft" aria-label="Custom design options"><div className={`section-shell grid items-center gap-7 py-8! md:py-10! ${all || preview ? 'lg:grid-cols-[1.1fr_0.9fr]' : ''}`}>
    <div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Made by you{categoryName ? ` / ${categoryName}` : ''}</p><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{all ? 'Start with a varsity, bomber, coach, puffer jacket or fleece hoodie. Explore the available colors, lettering and artwork options in each designer.' : decoration ? 'Share your logo, lettering or artwork and discuss sizing, placement and decoration techniques with our team.' : link.interactive ? `Explore the ${link.title.replace('Design your own ', '')} designer, choose the available colors and details, and preview your design. Options vary by style.` : `Explore personalization for ${categoryName || 'this collection'}. Confirm available materials, artwork placement and design options with our team before ordering.`}</p>
      <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm">{(link.interactive || all ? ['Choose a style', 'Add your details', 'Review your design'] : ['Choose your product', 'Share your artwork', 'Confirm the details']).map((step, i) => <li key={step}><span className="mr-1 font-semibold text-primary">{i + 1}.</span>{step}</li>)}</ol>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2"><Link href={all ? '/design' : link.href} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800">{all ? 'Explore jacket designers' : link.label}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>{!all && <Link href={decoration ? '/materials-colors' : '/design'} className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">{decoration ? 'Materials & colors' : 'All jacket designers'}</Link>}</div>
      <nav aria-label="Personalization guides" className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">{(decoration ? [['/contact', 'Artwork & placement help'], ['/bulk-orders', 'Group orders']] : [['/materials-colors', 'Materials & colors'], ['/patches-embroidery', 'Patches & embroidery'], ['/size-guide', 'Size guide']]).map(([href, label]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-primary">{label}</Link>)}</nav>
    </div>
    {all ? <div><div className="grid grid-cols-3 gap-2 sm:gap-3">{designers.map(item => <Link key={item.key} href={item.href} className="group overflow-hidden rounded-xl border bg-white text-zinc-900"><div className="relative h-36 sm:h-48"><Image src={(images[item.key] || defaults[item.key]).url} alt={(images[item.key] || defaults[item.key]).alt} fill sizes="(max-width: 1023px) 30vw, 180px" className="object-contain p-2" /></div><span className="flex min-h-11 items-center justify-center gap-1 border-t text-xs font-semibold group-hover:text-red-800 sm:text-sm">{item.label}<ArrowRight aria-hidden="true" className="h-3 w-3" /></span></Link>)}</div><div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm"><Link href="/design/coach" className="inline-flex min-h-11 items-center underline underline-offset-4">Coach designer</Link><Link href="/design/hoodie" className="inline-flex min-h-11 items-center underline underline-offset-4">Fleece hoodie designer</Link></div></div> : preview ? <div className="relative mx-auto h-56 w-full max-w-sm overflow-hidden rounded-xl border bg-white sm:h-64"><CollectionDesignImage key={previewUrls.join('|')} urls={previewUrls} alt={previewAlt} /></div> : null}
  </div></section>
}
