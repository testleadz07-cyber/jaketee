import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Image from '@/components/optimized-image'
import { Button } from '@/components/ui/button'
import patchImages from '@/data/patch-images.json'

const materialRoot = 'https://res.cloudinary.com/dhdfbl8pc/image/upload/'
const materials = [
  { title: 'Melton Wool', id: 'melton-wool', path: 'v1788899363/clothaa/exports/materials-colors/melton-wool-fabric-closeup-clothaa.jpg' },
  { title: 'Cowhide Leather', id: 'cowhide-leather', path: 'v1788899360/clothaa/exports/materials-colors/cowhide-leather-closeup-clothaa.jpg' },
  { title: 'Faux Leather', id: 'faux-leather', path: 'v1788899366/clothaa/exports/materials-colors/PU-faux-vegan-leather-for-jackets-closeup-Clothoo.jpg' },
  { title: 'Polyester Satin', id: 'polyester-satin', path: 'v1788899368/clothaa/exports/materials-colors/satin-fabric-for-jackets-closeup-clothaa.jpg' },
].map(item => ({ title: item.title, href: '/materials-colors', url: materialRoot + item.path, alt: `${item.title} fabric for custom jackets` }))

const patches = [
  { title: 'Direct Embroidery', id: 'digitizing-embroidery', key: 'digitizing-embroidery-2' },
  { title: 'Embroidered Patches', id: 'embroidered-patches', key: 'embroidered-patches-1' },
  { title: 'Chenille Patches', id: 'chenille-patches', key: 'chenille-patches-1' },
  { title: 'Sublimation Printing', id: 'sublimation-printing', key: 'sublimation-printing-1' },
].map(item => {
  const image = patchImages.find(image => image.key === item.key)!
  return { title: item.title, href: `/patches-embroidery#${item.id}`, url: image.url, alt: image.alt }
})

const guides = [
  { title: 'Materials & Colors', description: 'Compare wool, leather, satin, fleece, twill, and color options before choosing your custom jacket.', href: '/materials-colors', action: 'Explore materials & colors', images: materials },
  { title: 'Patches & Embroidery', description: 'Plan chenille patches, embroidery placement, lettering, artwork, and team personalization.', href: '/patches-embroidery', action: 'Explore patches & embroidery', images: patches },
]

export function CustomOptionsSection() {
  return (
    <section className="store-section store-section--plain store-section--accent" aria-labelledby="custom-options-heading">
      <div className="section-shell">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-muted-foreground">Make it yours</p>
            <h2 id="custom-options-heading" className="mt-2 text-3xl font-bold md:text-4xl">Explore custom options</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Compare jacket materials, then plan the patches and embroidery that make the design your own.</p>
          </div>
          <Button asChild className="self-start bg-red-700 text-white hover:bg-red-800 md:shrink-0"><Link href="/design/varsity">Start Custom Design</Link></Button>
        </div>
        <div className="divide-y rounded-xl border bg-card px-4 sm:px-6">
          {guides.map(guide => (
            <div key={guide.href} className="grid gap-5 py-6 lg:grid-cols-[0.8fr_2fr] lg:items-center lg:gap-8">
              <div>
                <h3 className="text-xl font-bold">{guide.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{guide.description}</p>
                <Link href={guide.href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">{guide.action}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {guide.images.map(image => (
                  <Link key={image.url} href={image.href} className="group min-w-0 overflow-hidden rounded-lg border bg-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted"><Image src={image.url} alt={image.alt} fill sizes="(max-width: 639px) 45vw, (max-width: 1023px) 23vw, 17vw" quality={80} className="media-zoom object-cover" /></div>
                    <span className="block px-2 py-3 text-center text-sm font-semibold leading-5 group-hover:text-primary">{image.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
