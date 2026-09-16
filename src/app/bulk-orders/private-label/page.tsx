import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Boxes, ClipboardList, PackageCheck, Repeat, Shirt, Tags } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { BulkOrderResources } from '@/components/bulk-order-resources'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'
const PAGE_URL = `${SITE_URL}/bulk-orders/private-label`

export const metadata: Metadata = {
  title: 'Private Label Custom Jackets | Jacketee',
  description:
    'Private label custom jacket programs for brands, merch lines, boutiques, and resellers. Plan samples, labels, trims, packaging, specs, and repeat orders.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Private Label Custom Jackets | Jacketee',
    description: 'Private label jacket programs with brand labels, custom specs, packaging direction, and repeat-order planning.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
}

const programNeeds = [
  ['Product direction', 'Define the silhouette, materials, target customer, price position, and final use.'],
  ['Branding package', 'Plan neck labels, woven labels, hang tags, packaging notes, and any trim direction.'],
  ['Sample review', 'Use samples or proofs to confirm fit, artwork scale, color, and construction details.'],
  ['Repeat orders', 'Keep specs organized so future production can stay consistent.'],
]

const deliverables = [
  'Jacket style and material direction',
  'Logo and artwork files',
  'Label and packaging requirements',
  'Color references',
  'Size range and fit notes',
  'Sample or approval expectations',
  'Target quantity and reorder plan',
  'Launch or delivery date',
]

const paths = [
  ['Merch line', 'Branded jackets for creators, musicians, teams, and community drops.'],
  ['Boutique capsule', 'Small collection planning for shops and apparel brands.'],
  ['Reseller program', 'Repeatable specs for ongoing private label jacket orders.'],
]

export default function PrivateLabelBulkOrdersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="border-b bg-zinc-950 text-white">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <Breadcrumbs
              items={[{ label: 'Bulk Orders', href: '/bulk-orders' }, { label: 'Private Label' }]}
              className="mb-8 text-white/70"
            />
            <div className="max-w-3xl">
              <Badge className="mb-5 bg-white/10 text-white hover:bg-white/10">Brands and resellers</Badge>
              <h1 className="text-4xl font-black leading-tight md:text-6xl">Private Label Custom Jackets</h1>
              <p className="mt-6 text-lg leading-8 text-white/75">
                Build custom jacket programs for your brand with label direction, packaging notes, sample review, and repeat-order planning.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
                  <Link href="/contact?topic=private-label">
                    Request Private Label Quote
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                  <Link href="/materials-colors">View Materials</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [Tags, 'Brand details', 'Plan woven labels, hang tags, inside labels, and packaging notes.'],
              [Shirt, 'Custom specs', 'Define silhouette, fabric, trims, decoration, fit, and color direction.'],
              [Repeat, 'Repeat-order ready', 'Keep successful specs organized for restocks and future drops.'],
            ].map(([Icon, title, text]) => (
              <Card key={String(title)} className="rounded-lg">
                <CardContent className="p-6">
                  <Icon className="h-7 w-7 text-primary" />
                  <h2 className="mt-5 text-xl font-bold">{String(title)}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{String(text)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/25">
          <div className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-[0.8fr_1.2fr] md:py-16">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-primary">Who it is for</p>
              <h2 className="mt-2 text-3xl font-bold">Private label paths</h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Private label jacket orders need more than a logo. The strongest programs define product details, approval steps, and packaging expectations early.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {paths.map(([title, text]) => (
                <Card key={title} className="rounded-lg">
                  <CardContent className="p-5">
                    <Boxes className="h-5 w-5 text-primary" />
                    <h3 className="mt-4 font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-2 md:py-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Program structure</p>
            <h2 className="mt-2 text-3xl font-bold">From concept to reorderable specs</h2>
            <div className="mt-6 space-y-3">
              {programNeeds.map(([title, text], index) => (
                <div key={title} className="flex gap-4 rounded-lg border bg-card p-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Quote checklist</p>
            <h2 className="mt-2 text-3xl font-bold">What helps us quote clearly</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {deliverables.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-md border bg-card p-3 text-sm font-medium">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/25">
          <div className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-[0.9fr_1.1fr] md:py-16">
            <Card className="rounded-lg">
              <CardContent className="p-6">
                <ClipboardList className="h-8 w-8 text-primary" />
                <h3 className="mt-5 text-2xl font-bold">Samples and approvals</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Private label work should include a clear approval point for artwork scale, fit direction, label placement, and packaging notes before larger production.
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-lg">
              <CardContent className="p-6">
                <PackageCheck className="h-8 w-8 text-primary" />
                <h3 className="mt-5 text-2xl font-bold">Consistent restocks</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Once a style works, organized specs help keep future restocks aligned with your approved materials, colors, trims, and decoration choices.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <BulkOrderResources kind="private-label" />

        <section className="border-t bg-zinc-950 text-white">
          <div className="container mx-auto grid gap-6 px-4 py-12 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-bold">Planning a private label jacket line?</h2>
              <p className="mt-3 text-white/70">Send your style direction, logo files, quantity range, and launch goals.</p>
            </div>
            <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
              <Link href="/contact?topic=private-label">Request Private Label Quote</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
