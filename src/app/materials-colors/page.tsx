import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Layers, Palette, Ruler, Sparkles } from 'lucide-react'
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
const PAGE_URL = `${SITE_URL}/materials-colors`
const legacyAssetBrand = ['clo', 'thaa'].join('')
const legacyAltAssetBrand = ['Clo', 'thoo'].join('')
const assetFolder = `${legacyAssetBrand}/exports/materials-colors`
const cloudinaryAsset = (version: number, fileName: string) =>
  `https://res.cloudinary.com/dhdfbl8pc/image/upload/v${version}/${assetFolder}/${fileName}`

export const metadata: Metadata = {
  title: 'Varsity Jacket Materials & Colors | Jacketee',
  description:
    'Compare melton wool, leather, satin, fleece, twill, soft-shell, nylon, suede, snaps, zips, and 30+ jacket color swatches before starting a custom order.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Varsity Jacket Materials & Colors | Jacketee',
    description:
      'Compare jacket fabrics, finishes, and color swatches for custom varsity jackets, bomber jackets, hoodies, and coach jackets.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
    images: [
      {
        url: cloudinaryAsset(1788899355, `${legacyAssetBrand}-materials-colors-for-custom-jackets.jpg`),
        width: 1200,
        height: 630,
        alt: 'Jacket materials and colors for custom jackets',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Varsity Jacket Materials & Colors | Jacketee',
    description: 'Compare materials and color swatches before you start a custom jacket order.',
  },
}

type Swatch = {
  name: string
  hex: string
}

type Material = {
  id: string
  name: string
  image: string
  texture: string
  alt: string
  climate: string
  colors: string
  features: string[]
  text: string
  cta: string
  href: string
  swatchSet?: string
  swatches?: Swatch[]
}

const commonSwatches: Swatch[] = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Cream', hex: '#fffed0' },
  { name: 'Beige', hex: '#d1c4a4' },
  { name: 'Black', hex: '#000000' },
  { name: 'Dark Grey', hex: '#565656' },
  { name: 'Light Grey', hex: '#99999a' },
  { name: 'Forest Green', hex: '#174633' },
  { name: 'Kelly Green', hex: '#44883e' },
  { name: 'Olive', hex: '#4f583d' },
  { name: 'Navy Blue', hex: '#152347' },
  { name: 'Royal Blue', hex: '#1a4096' },
  { name: 'Sky Blue', hex: '#83c2e7' },
  { name: 'Teal Blue', hex: '#005355' },
  { name: 'Dark Purple', hex: '#3b275b' },
  { name: 'Hot Pink', hex: '#dd1d58' },
  { name: 'Baby Pink', hex: '#fed0e4' },
  { name: 'Dark Maroon', hex: '#601f2a' },
  { name: 'Light Maroon', hex: '#a01526' },
  { name: 'Red', hex: '#e00000' },
  { name: 'Orange', hex: '#e95926' },
  { name: 'Athletic Gold', hex: '#ffb81c' },
  { name: 'Old Gold', hex: '#b7923e' },
  { name: 'Yellow', hex: '#eadc32' },
  { name: 'Dark Brown', hex: '#81533f' },
  { name: 'Camel Brown', hex: '#9f885e' },
]

const leatherExtraSwatches: Swatch[] = [
  { name: 'Salmon', hex: '#eaa794' },
  { name: 'Light Aqua', hex: '#3aa9b2' },
  { name: 'Lavender', hex: '#c1a7e2' },
  { name: 'Vegas Gold', hex: '#c5b783' },
  { name: 'Light Brown', hex: '#9b7f6f' },
  { name: 'Tan', hex: '#a0522d' },
]

const swatchLookup = [...commonSwatches, ...leatherExtraSwatches].reduce<Record<string, Swatch>>(
  (acc, swatch) => {
    acc[swatch.name.toLowerCase()] = swatch
    return acc
  },
  {}
)

const materials: Material[] = [
  {
    id: 'melton-wool',
    name: 'Melton Wool',
    image: cloudinaryAsset(1788899363, `melton-wool-fabric-closeup-${legacyAssetBrand}.jpg`),
    texture: cloudinaryAsset(1788899364, 'melton-wool-texture.png'),
    alt: 'Melton wool for custom jackets',
    climate: 'Cold',
    colors: '25 shades',
    features: ['Durable', 'Wind Resistant', 'Classic Style'],
    text: 'Jacketee uses 24oz melton wool for varsity jackets. It is durable, warm, and maintains its shape over years of wear.',
    cta: 'Shop Melton Wool Jackets',
    href: '/varsity-jackets/wool',
    swatchSet: 'commonSwatches',
  },
  {
    id: 'cowhide-leather',
    name: 'Cowhide Leather',
    image: cloudinaryAsset(1788899360, `cowhide-leather-closeup-${legacyAssetBrand}.jpg`),
    texture: cloudinaryAsset(1788899361, 'cowhide-leather-texture.png'),
    alt: 'Cowhide leather for custom jackets',
    climate: 'All-Season',
    colors: '31 shades',
    features: ['Durable', 'Smooth Feel', 'Classic Look'],
    text: 'Cowhide leather is a signature material for bomber and varsity sleeves. It offers natural durability, a smooth finish, and lasting appeal.',
    cta: 'Shop Cowhide Leather Jackets',
    href: '/bomber-jackets',
    swatchSet: 'commonSwatches + leatherExtraSwatches',
  },
  {
    id: 'sheep-leather',
    name: 'Sheep Leather',
    image: cloudinaryAsset(1788899373, `sheepskin-leather-closeup-${legacyAssetBrand}.jpg`),
    texture: cloudinaryAsset(1788899371, 'sheep-leather-texture.png'),
    alt: 'Sheep leather for custom jackets',
    climate: 'Mild to Cold',
    colors: '21 shades',
    features: ['Lightweight', 'Soft Touch', 'Flexible'],
    text: 'Sheep leather is soft and lightweight, giving premium jackets a smooth finish with comfortable flexibility.',
    cta: 'Shop Sheep Leather Jackets',
    href: '/varsity-jackets/all-leather',
    swatchSet:
      'White, Cream, Beige, Black, Dark Grey, Light Grey, Forest Green, Kelly Green, Olive, Navy Blue, Royal Blue, Sky Blue, Hot Pink, Baby Pink, Dark Maroon, Light Maroon, Red, Orange, Athletic Gold, Light Brown, Tan',
  },
  {
    id: 'faux-leather',
    name: 'Faux Leather',
    image: cloudinaryAsset(1788899366, `PU-faux-vegan-leather-for-jackets-closeup-${legacyAltAssetBrand}.jpg`),
    texture: cloudinaryAsset(1788899362, 'faux-leather-texture.png'),
    alt: 'Faux leather for custom jackets',
    climate: 'All-Season',
    colors: '17 shades',
    features: ['Vegan', 'Cost-Effective', 'Durable'],
    text: 'Faux leather is a vegan-friendly alternative to genuine leather. It is durable, versatile, and popular for fashion jackets.',
    cta: 'Shop Faux Leather Jackets',
    href: '/varsity-jackets/faux-leather',
    swatchSet:
      'White, Cream, Beige, Black, Dark Grey, Light Grey, Forest Green, Kelly Green, Navy Blue, Royal Blue, Sky Blue, Hot Pink, Baby Pink, Dark Maroon, Light Maroon, Red, Orange',
  },
  {
    id: 'polyester-satin',
    name: 'Polyester Satin',
    image: cloudinaryAsset(1788899368, `satin-fabric-for-jackets-closeup-${legacyAssetBrand}.jpg`),
    texture: cloudinaryAsset(1788899369, 'satin-fabric-texture.png'),
    alt: 'Polyester satin for custom jackets',
    climate: 'Mild',
    colors: '29 shades',
    features: ['Glossy', 'Lightweight', 'Vibrant Colors'],
    text: 'Polyester satin is glossy, smooth, and lightweight. It is ideal for souvenir, baseball, and statement jackets.',
    cta: 'Shop Polyester Satin Jackets',
    href: '/varsity-jackets/satin',
    swatchSet: 'commonSwatches + Light Aqua, Lavender, Vegas Gold, Light Brown',
  },
  {
    id: 'cotton-fleece',
    name: 'Cotton Fleece',
    image: cloudinaryAsset(1788899356, `cotton-fleece-fabric-for-jackets-closeup-${legacyAssetBrand}.webp`),
    texture: cloudinaryAsset(1788899357, 'cotton-fleece-fabric-texture.png'),
    alt: 'Cotton fleece for custom jackets',
    climate: 'Cool Weather',
    colors: '25 shades',
    features: ['Warm', 'Soft', 'Breathable'],
    text: 'Cotton fleece is soft, warm, and breathable, making it a practical choice for hoodies and casual letterman jackets.',
    cta: 'Shop Cotton Fleece Hoodies',
    href: '/fleece-hoodies',
    swatchSet: 'commonSwatches',
  },
  {
    id: 'cotton-twill',
    name: 'Cotton Twill',
    image: cloudinaryAsset(1788899358, `cotton-twill-fabric-for-jackets-closeup-${legacyAssetBrand}.webp`),
    texture: cloudinaryAsset(1788899359, 'cotton-twill-fabric-texture.png'),
    alt: 'Cotton twill for custom jackets',
    climate: 'All-Season',
    colors: '25 shades',
    features: ['Sturdy', 'Wrinkle-Resistant', 'Everyday Wear'],
    text: 'Cotton twill is sturdy and wrinkle-resistant, a strong fit for coach jackets, work jackets, and daily outerwear.',
    cta: 'Shop Cotton Twill Jackets',
    href: '/coach-jackets',
    swatchSet: 'commonSwatches',
  },
  {
    id: 'soft-shell',
    name: 'Soft-Shell',
    image: cloudinaryAsset(1788899379, `softshell-fabric-for-jackets-closeup-${legacyAssetBrand}.webp`),
    texture: cloudinaryAsset(1788899381, 'softshell-fabric-texture.png'),
    alt: 'Soft-shell fabric for custom jackets',
    climate: 'Cold & Windy',
    colors: '21 shades',
    features: ['Outdoor Ready', 'Wind Resistant', 'Water Repellent'],
    text: 'Soft-shell fabric combines performance and comfort, making it useful for outdoor jackets and team gear.',
    cta: 'Shop Soft-Shell Jackets',
    href: '/bomber-jackets',
    swatchSet:
      'White, Cream, Beige, Black, Dark Grey, Light Grey, Forest Green, Kelly Green, Olive, Navy Blue, Royal Blue, Sky Blue, Hot Pink, Baby Pink, Dark Maroon, Light Maroon, Red, Orange, Athletic Gold, Old Gold, Yellow',
  },
  {
    id: 'nylon-twill',
    name: 'Nylon Twill',
    image: cloudinaryAsset(1788899365, `nylon-twill-fabric-for-jackets-closeup-${legacyAssetBrand}.webp`),
    texture: cloudinaryAsset(1788899365, 'nylon-twill-fabric-texture.png'),
    alt: 'Nylon twill for custom jackets',
    climate: 'All-Season',
    colors: '13 shades',
    features: ['Lightweight', 'Water-Resistant', 'Durable'],
    text: 'Nylon twill is lightweight and water-resistant, widely used for coach jackets and easy daily wear.',
    cta: 'Shop Nylon Twill Jackets',
    href: '/coach-jackets',
    swatchSet:
      'White, Black, Light Grey, Olive, Navy Blue, Royal Blue, Light Aqua, Dark Maroon, Red, Orange, Athletic Gold, Yellow, Dark Brown',
  },
  {
    id: 'suede-leather',
    name: 'Suede Leather',
    image: cloudinaryAsset(1788899382, `suede-leather-closeup-${legacyAssetBrand}.jpg`),
    texture: cloudinaryAsset(1788899383, 'suede-leather-texture.png'),
    alt: 'Suede leather for custom jackets',
    climate: 'Mild',
    colors: '8 shades',
    features: ['Soft Texture', 'Casual Style', 'Fashion-Forward'],
    text: 'Suede leather has a soft, textured finish that adds a relaxed, fashion-forward look to custom jackets.',
    cta: 'Shop Suede Leather Jackets',
    href: '/bomber-jackets',
    swatchSet: 'White, Black, Light Grey, Forest Green, Navy Blue, Royal Blue, Sky Blue, Red',
  },
  {
    id: 'snaps-zips',
    name: 'Snaps & Zips',
    image: cloudinaryAsset(1788899385, `zip-snaps-for-varsity-jackets-${legacyAssetBrand}.jpg`),
    texture: cloudinaryAsset(1788899361, 'cowhide-leather-texture.png'),
    alt: 'Snaps and zippers for varsity jackets',
    climate: 'All-Season',
    colors: 'Custom finishes',
    features: ['Functional', 'Rust-Resistant', 'Custom Finish'],
    text: 'High-quality snaps and zippers complete every varsity jacket, bomber jacket, and custom team order.',
    cta: 'Start Customizing',
    href: '/design-your-own',
    swatches: [
      { name: 'Silver', hex: '#cbd5e1' },
      { name: 'Antique Brass', hex: '#9a6a2f' },
      { name: 'Black', hex: '#111827' },
      { name: 'White', hex: '#ffffff' },
    ],
  },
]

const materialComparison = [
  ['Melton Wool', 'High', 'High', 'Medium', 'Varsity Jackets', 'Cold Weather'],
  ['Cowhide Leather', 'Medium', 'Very High', 'Heavy', 'Bomber Jackets', 'Cool to Cold'],
  ['Sheep Leather', 'Medium-High', 'High', 'Light-Medium', 'Premium Jackets', 'Mild to Cold'],
  ['Faux Leather', 'Low-Medium', 'Medium', 'Light', 'Vegan Options', 'All-Season'],
  ['Polyester Satin', 'Low', 'Medium', 'Very Light', 'Baseball Jackets', 'Mild Weather'],
  ['Cotton Fleece', 'Medium', 'Medium', 'Medium', 'Hoodies', 'Cool Weather'],
  ['Soft-Shell', 'Medium', 'High', 'Medium', 'Outdoor Jackets', 'Cold & Windy'],
  ['Nylon Twill', 'Low', 'Medium', 'Very Light', 'Coach Jackets', 'All-Season'],
]

const stats = [
  {
    value: '10+',
    label: 'Unique Fabrics',
    text: 'Melton wool, leather, faux leather, satin, fleece, twill, soft-shell, nylon, suede, snaps, and zippers.',
  },
  {
    value: '30+',
    label: 'Fabric Colors',
    text: 'From maroon and navy to hot pink and old gold, swatches help match every school, team, or brand.',
  },
  {
    value: '150+',
    label: 'Total Shades',
    text: 'Color choices vary by material for bodies, sleeves, trims, and custom details.',
  },
  {
    value: '7-10 Days',
    label: 'Standard Production',
    text: 'No minimum order to get started, so custom outerwear stays practical for individuals and groups.',
  },
]

const faqs = [
  {
    question: 'What jacket materials are available?',
    answer:
      'We offer melton wool, cowhide leather, sheep leather, faux leather, satin, fleece, cotton twill, soft-shell, nylon, suede, plus snaps and zippers.',
  },
  {
    question: 'How many jacket colors can I choose from?',
    answer:
      'Jacketee provides more than 150 shades across all materials. Options range from traditional varsity colors to bold modern tones.',
  },
  {
    question: 'Which material is best for varsity jackets?',
    answer:
      'Melton wool with leather sleeves is the traditional choice for varsity jackets. Satin and fleece are good lighter-weight options.',
  },
  {
    question: 'What are the most popular bomber jacket colors?',
    answer:
      'Black, olive, navy, burgundy, and brown are popular bomber jacket colors. Custom shades are also available depending on material.',
  },
  {
    question: 'Can I match school or team colors?',
    answer:
      'Yes. Many schools, clubs, and sports teams order jackets matched to official colors using our swatch range.',
  },
  {
    question: 'How do I care for different jacket materials?',
    answer:
      'Wool and fleece should be dry-cleaned, leather requires conditioning, and nylon or satin can be wiped clean. Proper care keeps colors bright.',
  },
]

function getSwatches(material: Material) {
  if (material.swatches) return material.swatches
  if (material.swatchSet === 'commonSwatches') return commonSwatches
  if (material.swatchSet === 'commonSwatches + leatherExtraSwatches') {
    return [...commonSwatches, ...leatherExtraSwatches]
  }
  if (!material.swatchSet) return []

  const names = material.swatchSet
    .replace('commonSwatches +', commonSwatches.map((swatch) => swatch.name).join(',') + ',')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)

  return names.map((name) => swatchLookup[name.toLowerCase()]).filter(Boolean)
}

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

export default function MaterialsColorsPage() {
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
            <Breadcrumbs items={[{ label: 'Materials & Colors' }]} className="mb-8" />
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="max-w-3xl">
                <Badge variant="secondary" className="mb-4">For schools, teams, clubs, and brands</Badge>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                  Jacket Materials & Colors
                </h1>
                <p className="mt-5 text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Pick your fabric first. Then match your colors. Compare varsity jacket materials and color swatches for every jacket style we make.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link href="/design-your-own">
                      Start Designing
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/contact">Ask About Materials</Link>
                  </Button>
                </div>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={cloudinaryAsset(1788899355, `${legacyAssetBrand}-materials-colors-for-custom-jackets.jpg`)}
                  alt="Jacket materials and colors for custom jackets"
                  fill
                  priority
                  sizes="(min-width: 1024px) 48vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10 md:py-14">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="border">
                <CardContent className="p-5">
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <h2 className="mt-2 font-semibold">{stat.label}</h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{stat.text}</p>
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
                Material guide
              </div>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold">Compare fabrics, textures, and finishes</h2>
              <p className="mt-3 text-muted-foreground">
                Each material has a different feel, weight, finish, and color range. Use this guide to choose the right base before placing a custom order.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {materials.map((material) => {
                const swatches = getSwatches(material)

                return (
                  <Card key={material.id} className="overflow-hidden border">
                    <div className="relative aspect-[16/10] bg-muted">
                      <Image
                        src={material.image}
                        alt={material.alt}
                        fill
                        sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold">{material.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {material.climate} / {material.colors}
                          </p>
                        </div>
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                          <Image
                            src={material.texture}
                            alt={`${material.name} texture`}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{material.text}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {material.features.map((feature) => (
                          <span
                            key={feature}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground"
                          >
                            <Check className="h-3 w-3 text-primary" />
                            {feature}
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 grid grid-cols-9 gap-1.5">
                        {swatches.slice(0, 27).map((swatch) => (
                          <span
                            key={`${material.id}-${swatch.name}`}
                            title={swatch.name}
                            className="h-6 rounded-sm border"
                            style={{ backgroundColor: swatch.hex }}
                          />
                        ))}
                      </div>
                      <Button asChild variant="outline" className="mt-5 w-full">
                        <Link href={material.href}>{material.cta}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Palette className="h-4 w-4" />
                Color range
              </div>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold">Melton wool x cowhide leather</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                The iconic varsity combination gives you a wide range of body and sleeve pairings, from classic school colors to bold custom contrasts.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold">26</p>
                  <p className="text-xs text-muted-foreground">Wool colors</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold">32</p>
                  <p className="text-xs text-muted-foreground">Leather colors</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold">832</p>
                  <p className="text-xs text-muted-foreground">Pairings</p>
                </div>
              </div>
              <Button asChild className="mt-6">
                <Link href="/design-your-own">Start Your Custom Combo</Link>
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted">
                  <tr className="text-left">
                    <th className="p-3 font-semibold">Material</th>
                    <th className="p-3 font-semibold">Warmth</th>
                    <th className="p-3 font-semibold">Durability</th>
                    <th className="p-3 font-semibold">Weight</th>
                    <th className="p-3 font-semibold">Best For</th>
                    <th className="p-3 font-semibold">Weather</th>
                  </tr>
                </thead>
                <tbody>
                  {materialComparison.map((row) => (
                    <tr key={row[0]} className="border-t">
                      {row.map((cell, cellIndex) => (
                        <td key={`${row[0]}-${cellIndex}`} className="p-3 text-muted-foreground first:font-medium first:text-foreground">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/25">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Ruler className="h-4 w-4" />
                  Common questions
                </div>
                <h2 className="mt-3 text-3xl md:text-4xl font-bold">Materials FAQ</h2>
                <p className="mt-3 text-muted-foreground">
                  Quick answers for choosing fabrics, colors, care methods, and team color matching.
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
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="rounded-lg border bg-card p-6 text-center md:p-10">
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-4 text-3xl font-bold">Ready to choose your jacket materials?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Start with a fabric, select body and sleeve colors, then add your custom details for a jacket that fits your team, school, brand, or personal style.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/design-your-own">Start Designing</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
