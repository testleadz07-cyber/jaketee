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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'
const PAGE_URL = `${SITE_URL}/patches-embroidery`
const legacyAssetBrand = ['clo', 'thaa'].join('')
const baseAssetPath = `https://res.cloudinary.com/dhdfbl8pc/image/upload`
const patchAsset = (version: number, fileName: string, exported = false) =>
  `${baseAssetPath}/v${version}/${legacyAssetBrand}/${exported ? 'exports/' : ''}patches-embroidery/${fileName}`

const heroImage = patchAsset(1788899943, 'hero__varsity-jacket-patches-embroidery-hero.jpg', true)

export const metadata: Metadata = {
  title: 'Varsity Jacket Patches & Embroidery Guide | Jacketee',
  description:
    'Compare chenille, felt, embroidered, woven, leather, puff, tackle twill, DTF, screen print, HTV, sublimation, and woven label options for custom jackets.',
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
  {
    src: patchAsset(1781553081, 'b4212df3-5e57-45b7-aa65-5c872d13016c.jpg'),
    alt: 'Front placement guide for letters, names, and small patches',
  },
  {
    src: patchAsset(1781553091, '84875029-a85e-4cbc-8ac0-afe37f6222a0.jpg'),
    alt: 'Back placement guide for large names, numbers, and logos',
  },
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
      { src: patchAsset(1781553319, 'f3089ec8-7ea4-4436-a204-314fb37c6783.jpg'), alt: 'Triple felt varsity patch close-up' },
      { src: patchAsset(1781553762, '879031f1-57b0-4c56-8de3-48caedf428aa.jpg'), alt: 'Champion felt letters on jacket back' },
      { src: patchAsset(1781554470, 'ed1e359a-9902-4c8f-a811-6e1088f32609.jpg'), alt: 'Sleeve felt patches with chevrons and year' },
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
      { src: patchAsset(1781554914, '4cae473a-2eec-4af2-8803-9204ba095b15.jpg'), alt: 'Felt embroidered single letter chest patch' },
      { src: patchAsset(1781554992, '57235533-2052-4171-a4d6-102821b6c928.jpg'), alt: 'Felt embroidered school crest sleeve patch' },
      { src: patchAsset(1781555038, 'b20d2b63-2794-46ec-b36c-b533c0f3d9e6.jpg'), alt: 'Embroidered logo patch on satin varsity jacket' },
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
      { src: patchAsset(1781555387, '935621ee-8c28-4cf1-a706-f1329d5b7235.jpg'), alt: 'Layered chenille chest letter on varsity jacket' },
      { src: patchAsset(1781555391, '9acc3c27-a073-4581-ab47-8bb7697772d8.jpg'), alt: 'Chenille sleeve stack with year and captain patch' },
      { src: patchAsset(1781555489, '5cc04226-f4a7-4683-89bf-e6e40a8be011.jpg'), alt: 'Bold chenille back mascot patch' },
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
      { src: patchAsset(1781555985, '58cc989d-ec08-4935-8c97-e1897752599f.jpg'), alt: 'Direct embroidered letter example' },
      { src: patchAsset(1781555999, 'fbea5064-3961-4113-80ad-b99653b9a82c.jpg'), alt: 'Logo embroidery close-up' },
      { src: patchAsset(1781556074, '9309189f-83a4-4fb5-b188-1dc38e9794c6.jpg'), alt: 'Name embroidery on chest' },
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
      { src: patchAsset(1781556292, 'd78a5150-cd3e-4d90-a25e-d59c851298bf.jpg'), alt: 'Direct chenille script on satin right chest' },
      { src: patchAsset(1781556310, 'd3884024-d453-4618-8fd6-46f7b7cc254e.jpg'), alt: 'Pacific State chenille embroidery' },
      { src: patchAsset(1781556286, 'b077264d-3124-4f38-9130-4635941ce9ae.jpg'), alt: 'Mascot chenille embroidery' },
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
      { src: patchAsset(1781556719, 'da0a963e-a436-4f4a-a122-24d935d58602.jpg'), alt: 'Woven patch macro showing fine threads' },
      { src: patchAsset(1781556726, 'ec26a082-68da-4341-9cce-007f1fd8d299.jpg'), alt: 'Woven crest on jacket back' },
      { src: patchAsset(1781556762, '6d6f6972-a8d9-4ba1-9e7a-016c4f080fe3.jpg'), alt: 'Woven crest chest patch' },
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
      { src: patchAsset(1781556891, '2a1a9be5-4df3-4800-ab5d-1baf684bc8bf.jpg'), alt: 'Leather patch stitched on jacket' },
      { src: patchAsset(1781556953, '8b39a223-acc4-402f-a221-fdb78cd18967.jpg'), alt: 'Leather letter patch on varsity jacket' },
      { src: patchAsset(1781556896, '64e10985-aacd-4e10-a53c-2dc8c8362f13.jpg'), alt: 'Cowhide leather letter patch' },
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
      { src: patchAsset(1781557247, '51d6e62f-568f-4a27-96c3-c4b590748e0f.jpg'), alt: 'Puff embroidery raised text on jacket back' },
      { src: patchAsset(1781557184, '8acfba72-3ecd-43c2-a552-c14055abef17.jpg'), alt: 'Raised year embroidery on sleeve' },
      { src: patchAsset(1788899957, 'puff-embroidery__puff-left-chest-wordmark-white-black.jpg', true), alt: 'Puff left chest wordmark' },
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
      { src: patchAsset(1781557433, '771151d6-0e58-4699-b080-9d414c8b9857.jpg'), alt: 'Tackle twill letter patch on chest' },
      { src: patchAsset(1781557531, '8f97fb35-1bf9-41a1-bcd1-bd4c51e89651.jpg'), alt: 'Tackle twill number patches' },
      { src: patchAsset(1781557453, 'b103bd03-8b0a-48cc-975f-fc7a3d202623.jpg'), alt: 'Tackle twill back wordmark' },
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
      { src: patchAsset(1781560288, '875f2ae3-4d6c-4d27-a0c7-9e415460c007.jpg'), alt: 'DTF print on hoodie' },
      { src: patchAsset(1781560293, '11dea561-aac1-4dd5-acc5-d58eff39f8fb.jpg'), alt: 'Detailed DTF transfer on satin' },
      { src: patchAsset(1781560320, 'b47e1fff-1d77-49b1-a011-5ef161ee20e4.jpg'), alt: 'DTF logo on satin' },
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
      { src: patchAsset(1781560457, '0ec6d4fe-9cc3-44ea-8fb5-980ec145be4a.jpg'), alt: 'Screen printing example' },
      { src: patchAsset(1781560517, '696f099d-6c22-438d-acd5-0f2f2f09af5a.jpg'), alt: 'Screen printed hoodie chest close-up' },
      { src: patchAsset(1781560469, '925c80c3-2fdc-4ff7-bece-0c45b3b75176.jpg'), alt: 'Screen printed coach jacket back' },
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
      { src: patchAsset(1781560541, '36150789-1faa-4786-b07e-c2fe1110909c.jpg'), alt: 'HTV on cotton fleece' },
      { src: patchAsset(1781560543, '75087276-8e53-4eeb-8092-93b1a2b06e3b.jpg'), alt: 'Glitter HTV example' },
      { src: patchAsset(1781560546, '62544edf-6cfa-4d34-bc9f-b804ca133689.jpg'), alt: 'Puff HTV on cotton twill' },
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
      { src: patchAsset(1781560677, '60720534-878d-408b-a780-6bee4a32a1b7.jpg'), alt: 'Sublimation print on satin jacket' },
      { src: patchAsset(1781560737, 'e1df09dc-ccc5-49a0-a7d8-3b7c866d7b17.jpg'), alt: 'Full print sublimation satin jacket' },
      { src: patchAsset(1781560692, 'f0e9676c-950e-4a6d-9e77-7a3edddc98d3.jpg'), alt: 'Sublimation satin patch' },
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
      { src: patchAsset(1781560749, '0fc181af-82f3-483d-ae0b-da26e716df17.jpg'), alt: 'Woven neck label example' },
      { src: patchAsset(1781560755, '8f5bfab0-0fc4-49b9-8b62-1896b1962b92.jpg'), alt: 'Woven neck label with brand name' },
      { src: patchAsset(1781560760, '5b3b5f77-df52-48a5-8f01-2453d0a55254.jpg'), alt: 'Inside label sewn in jacket' },
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

export default function PatchesEmbroideryPage() {
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
                  Varsity Jacket Patches & Embroidery
                </h1>
                <p className="mt-5 text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Compare patch placement, patch types, embroidery, and printing methods before choosing the right look for your custom jacket.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link href="/design-your-own">
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
                  src={heroImage}
                  alt="Varsity jacket patches and embroidery examples"
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
            {placementImages.map((image) => (
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
              {methods.map((method) => (
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
                  <Link href="/design-your-own">
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
