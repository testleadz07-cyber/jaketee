import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Building2, ClipboardCheck, GraduationCap, PackageCheck, Tags, Users } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'
const PAGE_URL = `${SITE_URL}/bulk-orders`

export const metadata: Metadata = {
  title: 'Bulk Custom Jacket Orders | Jacketee',
  description:
    'Plan school, corporate, team, and private label bulk jacket orders with Jacketee. Compare order paths, artwork needs, sizing, samples, and production steps.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Bulk Custom Jacket Orders | Jacketee',
    description: 'Bulk custom jacket programs for schools, companies, teams, and private label brands.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
}

const orderTypes = [
  {
    title: 'Schools & Teams',
    href: '/bulk-orders/schools',
    icon: GraduationCap,
    text: 'Varsity jackets for classes, teams, clubs, alumni groups, and achievement programs.',
  },
  {
    title: 'Corporate Office',
    href: '/bulk-orders/corporate',
    icon: Building2,
    text: 'Logo jackets for staff uniforms, events, sales teams, onboarding kits, and brand merch.',
  },
  {
    title: 'Private Label',
    href: '/bulk-orders/private-label',
    icon: Tags,
    text: 'Branded jacket programs with labels, trims, packaging direction, samples, and repeat-order planning.',
  },
]

const processSteps = [
  ['Share the brief', 'Tell us jacket type, quantity range, deadline, decoration needs, sizes, and ship-to country.'],
  ['Confirm artwork', 'Send logo files, school marks, patches, colors, names, numbers, and placement notes.'],
  ['Review quote and proof', 'We prepare pricing assumptions and a digital proof before production moves forward.'],
  ['Approve production', 'Once specs are locked, the order moves into materials, decoration, sewing, quality checks, and shipping.'],
]

const quoteNeeds = [
  'Estimated quantity',
  'Jacket style',
  'Sizes and fit needs',
  'Logo or artwork files',
  'Patch and embroidery placement',
  'Target delivery date',
  'Shipping destination',
  'Branding or packaging needs',
]

export default function BulkOrdersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="border-b bg-zinc-950 text-white">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <Breadcrumbs items={[{ label: 'Bulk Orders' }]} className="mb-8 text-white/70" />
            <div className="max-w-3xl">
              <Badge className="mb-5 bg-white/10 text-white hover:bg-white/10">Bulk jacket programs</Badge>
              <h1 className="text-4xl font-black leading-tight md:text-6xl">Bulk Custom Jacket Orders</h1>
              <p className="mt-6 text-lg leading-8 text-white/75">
                Build a clear jacket program for schools, companies, teams, and brands. Jacketee helps organize the style,
                artwork, sizing, proofing, and production details before your order moves forward.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
                  <Link href="/contact?topic=bulk-order">
                    Request a Bulk Quote
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                  <Link href="/materials-colors">Compare Materials</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {orderTypes.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="group rounded-lg border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-accent">
                  <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-5 text-xl font-bold">{item.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  <span className="mt-5 inline-flex items-center text-sm font-semibold text-primary">
                    View details
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="border-y bg-muted/25">
          <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-[0.9fr_1.1fr] md:py-16">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-primary">How it works</p>
              <h2 className="mt-2 text-3xl font-bold">A cleaner process before production starts</h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Bulk jacket orders work best when the design, roster, artwork, and delivery goals are clear before the order is approved.
              </p>
            </div>
            <div className="grid gap-3">
              {processSteps.map(([title, text], index) => (
                <Card key={title} className="rounded-lg">
                  <CardContent className="flex gap-4 p-5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-primary">Quote checklist</p>
              <h2 className="mt-2 text-3xl font-bold">What to prepare before you ask for pricing</h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                You do not need every answer before contacting us, but the more details you share, the more useful the first quote will be.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {quoteNeeds.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-md border bg-card p-3 text-sm font-medium">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <Card className="rounded-lg bg-zinc-950 text-white">
              <CardContent className="p-6">
                <ClipboardCheck className="h-8 w-8 text-white/80" />
                <h3 className="mt-5 text-2xl font-bold">Need help organizing the order?</h3>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  Send what you have now. We can help turn a rough quantity, logo, and deadline into a cleaner production brief.
                </p>
                <Button asChild className="mt-6 bg-white text-black hover:bg-white/90">
                  <Link href="/contact?topic=bulk-order">Start a Quote</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-t bg-muted/25">
          <div className="container mx-auto grid gap-4 px-4 py-10 sm:grid-cols-3">
            {[
              [Users, 'Roster friendly', 'Plan names, numbers, sizes, and roles in one order.'],
              [PackageCheck, 'Proof before production', 'Review key visual details before bulk work starts.'],
              [BadgeCheck, 'Repeat-order ready', 'Keep specs organized for reorder programs.'],
            ].map(([Icon, title, text]) => (
              <div key={String(title)} className="rounded-lg border bg-background p-5">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 font-bold">{String(title)}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{String(text)}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
