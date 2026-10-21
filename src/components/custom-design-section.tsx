import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Image from '@/components/optimized-image'
import { Button } from '@/components/ui/button'
import { connectDB } from '@/lib/mongodb'
import SectionImage from '@/models/SectionImage'
import savedImages from '@/data/custom-design-images.json'

const styles = [
  { key: 'varsity', title: 'Varsity' },
  { key: 'bomber', title: 'Bomber' },
  { key: 'puffer', title: 'Puffer' },
]

const categoryDesigners: Record<string, { href: string; label: string; title: string }> = {
  'varsity-jackets': { href: '/design/varsity', label: 'Customize a varsity jacket', title: 'Design Your Own Varsity Jacket' },
  'bomber-jackets': { href: '/design/bomber', label: 'Customize a bomber jacket', title: 'Design Your Own Bomber Jacket' },
  'puffer-jackets': { href: '/design/puffer', label: 'Customize a puffer jacket', title: 'Design Your Own Puffer Jacket' },
  'coach-jackets': { href: '/design/coach', label: 'Customize a coach jacket', title: 'Design Your Own Coach Jacket' },
  'fleece-hoodies': { href: '/design/hoodie', label: 'Customize a fleece hoodie', title: 'Design Your Own Fleece Hoodie' },
}

export async function CustomDesignSection({ categorySlugs = [] }: { categorySlugs?: string[] } = {}) {
  // Resolve through the ancestor chain so material/fit subcategories inherit
  // their jacket family's designer. Other collections use the designer hub.
  const designer = categorySlugs.map(slug => categoryDesigners[slug]).find(Boolean)
  const designHref = designer?.href || (categorySlugs.length ? '/design' : '/design/varsity')
  const images: Record<string, { url: string; alt: string }> = Object.fromEntries(savedImages.map(image => [image.key, image]))
  try {
    if (await connectDB()) {
      const stored = await SectionImage.find({ section: 'home-custom-design' }).select('key url alt -_id').lean()
      for (const image of stored) images[image.key] = { url: image.url, alt: image.alt }
    }
  } catch (error) {
    console.error('Unable to load custom design images', error)
  }

  return (
    <section className="store-section store-section--soft" aria-labelledby="custom-design-heading">
      <div className="section-shell grid items-center gap-7 py-8! md:py-10! lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Made by you</p>
          <h2 id="custom-design-heading" className="mt-2 text-3xl font-bold md:text-4xl">{designer?.title || 'Design Your Own Jacket'}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{designer ? 'Choose your materials and colors, then personalize your design with names, letters, numbers, or uploaded logo artwork. Explore patches and embroidery for the finishing details.' : 'Choose varsity, bomber, or puffer. Make it yours with custom colors, names, letters, logo artwork, patches, and embroidery.'}</p>
          <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {['Choose a style', 'Add your details', 'Preview & check size'].map((step, index) => (
              <li key={step}><span className="mr-1.5 font-semibold text-primary">{index + 1}.</span>{step}</li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button asChild size="lg" className="bg-red-700 text-white hover:bg-red-800">
              <Link href={designHref}>Start Designing <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Link href={categorySlugs.length ? '/design' : '/design/varsity'} className="text-sm font-medium underline underline-offset-4 hover:text-primary">{categorySlugs.length ? 'Explore all jacket designers' : 'Customize a varsity jacket'}</Link>
          </div>
          <nav aria-label="Custom design guides" className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {[
              ['/materials-colors', 'Materials & colors'],
              ['/patches-embroidery', 'Patches & embroidery'],
              ['/size-guide', 'Size guide'],
            ].map(([href, label]) => <Link key={href} href={href} className="underline underline-offset-4 hover:text-primary">{label}</Link>)}
          </nav>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {styles.map(style => (
            <Link key={style.key} href={`/design/${style.key}`} className="interactive-lift group min-w-0 overflow-hidden rounded-lg border bg-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                <Image src={images[style.key].url} alt={images[style.key].alt} fill sizes="(max-width: 1023px) 30vw, 18vw" quality={80} className="media-zoom object-contain p-2" />
              </div>
              <span className="flex items-center justify-center gap-2 border-t px-2 py-3 text-sm font-semibold text-card-foreground group-hover:text-primary">{style.title}<ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
