import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Layers, MapPin, Palette, Scissors, Sparkles } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getPatchSectionImages } from '@/lib/patch-section-images'
import savedImages from '@/data/patch-images.json'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const PAGE_URL = `${SITE_URL}/patches-embroidery`
export const revalidate = 3600
const savedImageMap = Object.fromEntries(savedImages.map(image => [image.key, image]))
function patchImage(key: string) {
  const image = savedImageMap[key]
  if (!image) throw new Error(`Missing patch image: ${key}`)
  return { src: image.url, alt: image.alt }
}

const heroImage = patchImage('hero').src

const defaultMetadata: Metadata = {
  title: 'Chenille Patches for Letterman Jackets | Jacketee',
  description:
    'Compare chenille patches for letterman jackets, varsity jacket embroidery, felt, tackle twill, printing and label options for custom jacket designs.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Varsity Jacket Patches & Embroidery Guide | Jacketee',
    description:
      'Patch placement, patch types, embroidery, and printing methods for custom varsity jackets, bomber jackets, hoodies, and team apparel.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
    images: [
      {
        url: heroImage,
        width: 1200,
        height: 630,
        alt: 'Varsity jacket patches and embroidery examples',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Varsity Jacket Patches & Embroidery Guide | Jacketee',
    description: 'Compare custom patch, embroidery, and print options before starting your jacket order.',
  },
}

type ImageItem = {
  src: string
  alt: string
}

type Method = {
  id: string
  title: string
  badge?: string
  intro: string
  note?: string
  madeTitle: string
  made: string
  care: string
  best: string[]
  images: ImageItem[]
}

const navItems = [
  ['Placement & Sizes', 'placement-size-rules'],
  ['Felt Patches', 'felt-patches'],
  ['Embroidered Patches', 'embroidered-patches'],
  ['Chenille Patches', 'chenille-patches'],
  ['Direct Embroidery', 'digitizing-embroidery'],
  ['Woven Patches', 'woven-patches'],
  ['Puff Embroidery', 'puff-embroidery'],
  ['Printing', 'dtf-printing'],
  ['FAQs', 'faq'],
]

const placementImages: ImageItem[] = [
  patchImage('placement-front'),
  patchImage('placement-back'),
]

const placements = [
  ['Left Chest', '6"', 'Chenille letter, school crest, mascot, initials, school name'],
  ['Right Chest', '6"', 'Small player number, sport icon, position, graduation year'],
  ['Left Pocket', '4"', 'Name script, small number, senior patch, club tag'],
  ['Right Pocket', '4"', 'Small number, short motto, city patch, sponsor patch'],
  ['Left Sleeve', '5"', 'Sport patch, team logo, league patch, captain mark'],
  ['Right Sleeve', '5"', 'Graduation year, class patch, region patch, academic patch'],
  ['Left Forearm', '5"', 'Awards, varsity bars, tournament badges, stars'],
  ['Right Forearm', '5"', 'Captain year, team awards, championship badges'],
  ['Top Back', '14"', 'Last name, coach title, captain title, short slogan'],
  ['Middle Back', '14"', 'Big mascot, team name, large number, logo, statement patch'],
  ['Lower Back', '14"', 'City, state, motto, championship list, established year'],
  ['Inside Chest', '4"', 'Name label, student ID, team label, care label'],
]

const methodChooser = [
  ['Small text', 'Woven patches or direct embroidery'],
  ['3D look', 'Chenille patches or puff embroidery'],
  ['Budget option', 'Felt patches or screen printing'],
  ['Full color artwork', 'DTF printing or sublimation on poly fabrics'],
  ['Heavy wear', 'Tackle twill or direct embroidery'],
]

const methods: Method[] = [
  {
    id: 'felt-patches',
    title: 'Felt Patches for Varsity Jackets',
    intro:
      'Felt patches are soft shapes sewn onto the jacket. They are the classic pick for varsity letters, large numbers, and year patches.',
    note: 'Not best for tiny text or thin lines. Choose woven patches or direct embroidery for small details.',
    madeTitle: 'How Felt Patches Are Made',
    made: 'We cut felt into your letter or shape. For a raised effect, we stack one to three layers, then stitch the edge so it stays flat and clean.',
    care: 'Felt holds up well. Spot clean and avoid high heat. For wool varsity jackets, dry cleaning is safest.',
    best: ['Works best on: Melton wool, cotton fleece, cotton twill', 'Use with care on: Tiny text designs and very thin lines'],
    images: [
      patchImage('felt-patches-1'),
      patchImage('felt-patches-2'),
      patchImage('felt-patches-3'),
    ],
  },
  {
    id: 'embroidered-patches',
    title: 'Embroidered Patch Types',
    intro:
      'Embroidered patches combine the bold shape of felt with bright thread detail. They work well for logos with multiple colors and shapes.',
    madeTitle: 'How Embroidered Patches Are Made',
    made: 'We turn your artwork into a stitch file, sew thread onto felt, cut the patch, and sew it onto the jacket.',
    care: 'Avoid ironing directly on the thread. If washing at home, turn the jacket inside out and use cold water.',
    best: ['Works best on: Wool, fleece, twill, satin, nylon, soft-shell', 'Sew-on backing is safest for heat-sensitive fabrics'],
    images: [
      patchImage('embroidered-patches-1'),
      patchImage('embroidered-patches-2'),
      patchImage('embroidered-patches-3'),
    ],
  },
  {
    id: 'chenille-patches',
    title: 'Chenille Patches for Letterman Jackets',
    intro:
      'Chenille patches use thick, fluffy yarn for a soft raised feel. This is the classic letterman style for big letters and simple mascots.',
    madeTitle: 'How Chenille Patches Are Made',
    made: 'We sew chenille yarn loops onto a felt base, cut the patch, finish the edge, and add a clean border stitch.',
    care: 'Keep chenille away from heavy rubbing. Spot clean when possible. Dry cleaning works best for wool bodies.',
    best: ['Works best on: Melton wool, cotton fleece, cotton twill', 'Use with care on: Tiny text, thin outlines, and high-abrasion spots'],
    images: [
      patchImage('chenille-patches-1'),
      patchImage('chenille-patches-2'),
      patchImage('chenille-patches-3'),
    ],
  },
  {
    id: 'digitizing-embroidery',
    title: 'Direct Embroidery Options',
    intro:
      'Direct embroidery stitches your design right into the jacket fabric. It is a strong choice for chest names, small logos, and line art.',
    madeTitle: 'How Direct Embroidery Is Made',
    made: 'We digitize your artwork, load the stitch file into the machine, stitch the design into the fabric, then trim the back neatly.',
    care: 'Direct embroidery is one of the strongest options. Wash cold when needed. For wool jackets, dry cleaning is best.',
    best: ['Works best on: Wool, fleece, twill, satin with backing, soft-shell, vegan leather', 'Use with care on: Suede and dense fills on leather'],
    images: [
      patchImage('digitizing-embroidery-1'),
      patchImage('digitizing-embroidery-2'),
      patchImage('digitizing-embroidery-3'),
    ],
  },
  {
    id: 'chenille-embroidery',
    title: 'Direct Chenille Embroidery',
    intro:
      'Direct chenille uses fluffy yarn stitched right onto the jacket body for a soft, raised look on big letters and simple chest icons.',
    madeTitle: 'How Chenille Embroidery Is Made',
    made: 'We stitch chenille yarn straight onto the jacket. It forms soft loops that make the design thick and bold.',
    care: 'Avoid heavy rubbing on the yarn. Spot clean when possible. Dry cleaning is safest for wool jacket bodies.',
    best: ['Works best on: Melton wool, cotton fleece, cotton twill', 'Use with care on: Tiny details and thin satin without backing'],
    images: [
      patchImage('chenille-embroidery-1'),
      patchImage('chenille-embroidery-2'),
      patchImage('chenille-embroidery-3'),
    ],
  },
  {
    id: 'woven-patches',
    title: 'Woven Patches for Detailed Logos',
    badge: 'Bulk orders only',
    intro:
      'Woven patches use thin yarn to create sharp details. They are best for badges, flags, company logos, and small text.',
    madeTitle: 'How Woven Patches Are Made',
    made: 'We weave the design with thin yarn, then cut and finish the edges for a thin, detailed flat patch.',
    care: 'These patches last a long time because the weave is tight. Avoid high heat on hook-and-loop backing.',
    best: ['Works best on: Satin, soft-shell, nylon, wool, fleece', 'Use with care on: Very small patches where text may become unreadable'],
    images: [
      patchImage('woven-patches-1'),
      patchImage('woven-patches-2'),
      patchImage('woven-patches-3'),
    ],
  },
  {
    id: 'leather-patches',
    title: 'Leather Patches for Jackets',
    badge: 'Bulk orders only',
    intro:
      'Leather patches offer a clean, tough look. They are a strong fit for bomber jackets and brand-focused outerwear.',
    madeTitle: 'How Leather Patches Are Made',
    made: 'We laser cut the leather for clean edges, then sew the patch onto the jacket so it stays secure.',
    care: 'Avoid soaking leather patches. If the jacket gets wet, let it air dry naturally.',
    best: ['Works best on: Wool, fleece, twill, nylon, soft-shell', 'Use with care on: Suede and thin satin without backing'],
    images: [
      patchImage('leather-patches-1'),
      patchImage('leather-patches-2'),
      patchImage('leather-patches-3'),
    ],
  },
  {
    id: 'puff-embroidery',
    title: '3D Puff Embroidery',
    intro:
      'Puff embroidery places foam under the thread to raise the design. It makes bold text and simple shapes pop off the fabric.',
    madeTitle: 'How Puff Embroidery Is Made',
    made: 'We place foam under the stitch path, sew over it, and remove the extra foam after stitching.',
    care: 'Puff holds its shape well. Avoid crushing it or using high heat. Spot clean gently when possible.',
    best: ['Works best on: Cotton fleece, melton wool, thicker twill', 'Use with care on: Thin satin and lightweight nylon that can pucker'],
    images: [
      patchImage('puff-embroidery-1'),
      patchImage('puff-embroidery-2'),
      patchImage('puff-embroidery-3'),
    ],
  },
  {
    id: 'tackle-twill',
    title: 'Tackle Twill for Big Numbers',
    intro:
      'Tackle twill is fabric lettering sewn down with a clean border. It is ideal for large back numbers, player names, and sleeve years.',
    madeTitle: 'How Tackle Twill Is Made',
    made: 'We cut strong twill fabric into letters or numbers, then stitch the edge tightly so it stays flat.',
    care: 'Tackle twill is tough and sporty. Avoid high heat to protect the border stitch.',
    best: ['Works best on: Melton wool, cotton fleece, cotton twill, satin', 'Use with care on: Very thin fabrics without backing'],
    images: [
      patchImage('tackle-twill-1'),
      patchImage('tackle-twill-2'),
      patchImage('tackle-twill-3'),
    ],
  },
  {
    id: 'dtf-printing',
    title: 'DTF Printing for Full Color',
    intro:
      'DTF captures full-color artwork, photos, and small details. It is a flexible option for fleece hoodies, satin, twill, and many blends.',
    madeTitle: 'How DTF Printing Works',
    made: 'We print the design on special film, add adhesive powder, and heat press it onto the fabric.',
    care: 'Wash in cold water and never iron directly on the print.',
    best: ['Works best on: Cotton fleece, cotton twill, satin, nylon, many blends', 'Use with care on: Real leather and suede'],
    images: [
      patchImage('dtf-printing-1'),
      patchImage('dtf-printing-2'),
      patchImage('dtf-printing-3'),
    ],
  },
  {
    id: 'screen-printing',
    title: 'Screen Printing Options',
    intro:
      'Screen printing pushes ink through a mesh screen onto fabric. It works best for bold logos, simple shapes, and clean color blocks.',
    madeTitle: 'How Screen Printing Works',
    made: 'We prepare screens for each color, then press ink directly onto the garment.',
    care: 'Wash cold and avoid high heat drying so the ink stays smooth.',
    best: ['Works best on: Cotton twill and cotton fleece', 'Use with care on: Coated soft-shell and leather'],
    images: [
      patchImage('screen-printing-1'),
      patchImage('screen-printing-2'),
      patchImage('screen-printing-3'),
    ],
  },
  {
    id: 'htv-vinyl',
    title: 'Vinyl (HTV) Transfers',
    intro:
      'HTV is colored vinyl cut and pressed onto the jacket. It is best for names and numbers in one solid color.',
    madeTitle: 'How HTV Works',
    made: 'We cut vinyl shapes with a machine, then heat press them onto the garment for sharp, bright numbers.',
    care: 'Wash cold. Never iron directly on vinyl. Air dry for best durability.',
    best: ['Works best on: Cotton fleece, cotton twill, satin, nylon-rated vinyl', 'Use with care on: Heat-sensitive nylon, soft-shell, and leather'],
    images: [
      patchImage('htv-vinyl-1'),
      patchImage('htv-vinyl-2'),
      patchImage('htv-vinyl-3'),
    ],
  },
  {
    id: 'sublimation-printing',
    title: 'Sublimation Printing',
    intro:
      'Sublimation uses heat to dye ink into polyester. The print feels smooth and is great for custom linings and colorful patterns.',
    madeTitle: 'How Sublimation Works',
    made: 'We use high heat to push colored dye into the fibers so the design becomes part of the fabric.',
    care: 'Sublimation does not crack. Wash cold and avoid bleach to keep colors bright.',
    best: ['Works best on: Poly-based satin and many soft-shell fabrics', 'Use with care on: Cotton fleece, twill, wool, and real leather'],
    images: [
      patchImage('sublimation-printing-1'),
      patchImage('sublimation-printing-2'),
      patchImage('sublimation-printing-3'),
    ],
  },
  {
    id: 'woven-labels',
    title: 'Custom Woven Labels',
    intro:
      'Woven labels are small tags sewn inside the neck, hem, or lining. They are useful for team, school, and brand orders.',
    madeTitle: 'How Labels Are Made',
    made: 'We weave the tag art with tiny yarn, cut the edges, and sew the label into the jacket during production.',
    care: 'Woven labels do not fade. Wash cold and avoid intense heat.',
    best: ['Works best on: Inside lining, hem, and neck areas', 'Use with care on: High-friction spots where sharp edges can rub'],
    images: [
      patchImage('woven-labels-1'),
      patchImage('woven-labels-2'),
      patchImage('woven-labels-3'),
    ],
  },
]

const faqs = [
  {
    question: 'Which method is best for varsity letters?',
    answer:
      'Chenille and felt are the most common picks for chest letters. Tackle twill is great for sharp-edged numbers, and multiple methods can be mixed on one jacket.',
  },
  {
    question: 'Can you add names and years on sleeves?',
    answer:
      'Yes. Sleeve names, years, sport patches, captain marks, and achievement patches are common. Artwork is scaled to fit the sleeve area.',
  },
  {
    question: 'What if my logo has very small details?',
    answer:
      'Woven patches or direct embroidery are usually best for small details and small text because they hold detail better than chenille or felt.',
  },
  {
    question: 'Can you do inside neck labels for a brand?',
    answer: 'Yes. Woven labels can be added inside the neck, hem, or lining during bulk production.',
  },
  {
    question: 'Do patches and embroidery work on all fabrics?',
    answer:
      'Most jackets can handle decoration, but some materials have limits. Sublimation needs polyester, and heavy patches need a strong base.',
  },
  {
    question: 'Can you mix methods on one jacket?',
    answer:
      'Yes. Many jackets combine chenille, felt, direct embroidery, woven patches, tackle twill, DTF printing, and labels.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export async function generateMetadata(): Promise<Metadata> {
  const images = await getPatchSectionImages()
  return {
    ...defaultMetadata,
    openGraph: {
      ...defaultMetadata.openGraph,
      images: [{ url: images.hero?.url || heroImage, width: 1200, height: 630, alt: images.hero?.alt || 'Varsity jacket patches and embroidery examples' }],
    },
    twitter: { ...defaultMetadata.twitter, images: [images.hero?.url || heroImage] },
  }
}

export default async function PatchesEmbroideryPage() {
  const images = await getPatchSectionImages()
  const currentHero = images.hero || { url: heroImage, alt: 'Varsity jacket patches and embroidery examples' }
  const currentPlacements = placementImages.map((image, index) => {
    const replacement = images[index === 0 ? 'placement-front' : 'placement-back']
    return replacement ? { src: replacement.url, alt: replacement.alt } : image
  })
  const currentMethods = methods.map(method => ({
    ...method,
    images: method.images.map((image, index) => {
      const replacement = images[`${method.id}-${index + 1}`]
      return replacement ? { src: replacement.url, alt: replacement.alt } : image
    }),
  }))
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Header />

      <main className="flex-1">
        <section className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-8 md:py-12">
            <Breadcrumbs items={[{ label: 'Patches & Embroidery' }]} className="mb-8" />
            <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div className="max-w-3xl">
                <Badge variant="secondary" className="mb-4">For U.S. schools, teams, clubs, and brands</Badge>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                  Chenille Patches for Letterman Jackets
                </h1>
                <p className="mt-5 text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Chenille patches for letterman jackets add raised letters, mascots, names, and achievement details. Compare placement, embroidery, and printing methods.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link href="/custom-letterman-jackets">
                      Online Jacket Builder
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/materials-colors">Browse Materials & Colors</Link>
                  </Button>
                </div>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={currentHero.url}
                  alt={currentHero.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 48vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-b bg-background">
          <div className="container mx-auto px-4 py-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {navItems.map(([label, anchor]) => (
                <a
                  key={anchor}
                  href={`#${anchor}`}
                  className="shrink-0 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="placement-size-rules" className="container mx-auto px-4 py-12 md:py-16">
          <div className="mb-8 max-w-3xl">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <MapPin className="h-4 w-4" />
              Placement guide
            </div>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold">Patch Placement & Sizes</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We scale your artwork to match the final jacket size, from XS to 6XL. These are common placement zones and standard limits for a medium jacket.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {currentPlacements.map((image) => (
              <div key={image.alt} className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </div>
            ))}
          </div>

          <div className="mt-8 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="p-3 font-semibold">Placement</th>
                  <th className="p-3 font-semibold">Max Width</th>
                  <th className="p-3 font-semibold">Used For</th>
                </tr>
              </thead>
              <tbody>
                {placements.map(([name, maxWidth, usedFor]) => (
                  <tr key={name} className="border-t">
                    <td className="p-3 font-medium">{name}</td>
                    <td className="p-3 text-muted-foreground">{maxWidth}</td>
                    <td className="p-3 text-muted-foreground">{usedFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {methodChooser.map(([title, text]) => (
              <Card key={title} className="border">
                <CardContent className="p-4">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/25">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="mb-8 max-w-3xl">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Layers className="h-4 w-4" />
                Decoration methods
              </div>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold">Compare patch and embroidery options</h2>
              <p className="mt-3 text-muted-foreground">
                Choose the method based on artwork size, detail level, fabric, budget, and how the jacket will be worn.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {currentMethods.map((method) => (
                <Card key={method.id} id={method.id} className="scroll-mt-24 overflow-hidden border">
                  <div className="grid grid-cols-3 gap-1 bg-muted p-1">
                    {method.images.map((image) => (
                      <div key={image.src} className="relative aspect-square overflow-hidden rounded-md bg-background">
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          sizes="(min-width: 1280px) 11vw, (min-width: 768px) 16vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-semibold">{method.title}</h3>
                      {method.badge && <Badge variant="outline">{method.badge}</Badge>}
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{method.intro}</p>
                    {method.note && (
                      <p className="mt-3 rounded-md border bg-muted/60 p-3 text-xs text-muted-foreground">{method.note}</p>
                    )}
                    <div className="mt-4 space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold">{method.madeTitle}</h4>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{method.made}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">Care</h4>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{method.care}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {method.best.map((item) => (
                        <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Palette className="h-4 w-4" />
                Common questions
              </div>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold">Patches & Embroidery FAQ</h2>
              <p className="mt-3 text-muted-foreground">
                Quick answers for choosing patch types, sleeve details, small logos, labels, and mixed decoration methods.
              </p>
            </div>
            <Accordion type="single" collapsible className="rounded-lg border bg-background px-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="border-t bg-muted/25">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="rounded-lg border bg-card p-6 text-center md:p-10">
              <Sparkles className="mx-auto h-8 w-8 text-primary" />
              <h2 className="mt-4 text-3xl font-bold">Ready to add patches or embroidery?</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                Pick your jacket, choose the decoration method, and send us artwork for a proof before production.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/design/varsity">
                    <Scissors className="mr-2 h-4 w-4" />
                    Start Designing
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/materials-colors">View Materials & Colors</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
