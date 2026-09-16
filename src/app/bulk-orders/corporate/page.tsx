import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Building2, CalendarDays, PackageCheck, ShieldCheck, Shirt, Users } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { BulkOrderResources } from '@/components/bulk-order-resources'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'
const PAGE_URL = `${SITE_URL}/bulk-orders/corporate`

export const metadata: Metadata = {
  title: 'Corporate Custom Jacket Bulk Orders | Jacketee',
  description:
    'Corporate bulk jacket orders for branded uniforms, staff apparel, event merch, onboarding kits, and office teams. Plan logos, materials, sizing, and delivery.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Corporate Custom Jacket Bulk Orders | Jacketee',
    description: 'Logo jackets and branded outerwear programs for companies, teams, offices, and events.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
}

const programs = [
  ['Employee apparel', 'Consistent jackets for staff, office teams, field crews, and hospitality teams.'],
  ['Event merchandise', 'Limited-run jackets for conferences, launches, retreats, and trade shows.'],
  ['Client gifts', 'Premium branded outerwear for partner gifts and VIP programs.'],
  ['Team uniforms', 'Clean logo placement for sales, support, production, and operations groups.'],
]

const details = [
  'Logo files in vector or high-resolution format',
  'Brand colors or Pantone references',
  'Preferred jacket style and material',
  'Quantity range and size mix',
  'Decoration method and placement',
  'Delivery deadline and destination',
]

export default function CorporateBulkOrdersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="border-b bg-zinc-950 text-white">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <Breadcrumbs
              items={[{ label: 'Bulk Orders', href: '/bulk-orders' }, { label: 'Corporate' }]}
              className="mb-8 text-white/70"
            />
            <div className="max-w-3xl">
              <Badge className="mb-5 bg-white/10 text-white hover:bg-white/10">Corporate office and teams</Badge>
              <h1 className="text-4xl font-black leading-tight md:text-6xl">Corporate Custom Jacket Bulk Orders</h1>
              <p className="mt-6 text-lg leading-8 text-white/75">
                Create branded jackets for staff, events, onboarding, client gifts, and office programs with clear logo placement and consistent sizing.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
                  <Link href="/contact?topic=corporate-office-orders">
                    Request Corporate Quote
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                  <Link href="/patches-embroidery">View Logo Options</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [Building2, 'Brand ready', 'Match logo placement, colors, and jacket type to your company use case.'],
              [Users, 'Team sizing', 'Collect employee sizes and assign fits before production is approved.'],
              [PackageCheck, 'Event planning', 'Work backward from launch dates, conferences, or internal milestones.'],
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
              <p className="text-sm font-bold uppercase tracking-wide text-primary">Use cases</p>
              <h2 className="mt-2 text-3xl font-bold">Branded outerwear for real business needs</h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Corporate jacket programs usually need a balanced look: visible enough for brand recognition, clean enough for daily wear.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {programs.map(([title, text]) => (
                <Card key={title} className="rounded-lg">
                  <CardContent className="p-5">
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-[1fr_0.9fr] md:py-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Logo and artwork</p>
            <h2 className="mt-2 text-3xl font-bold">Keep the brand clean on the garment</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Simple embroidery often works best for office jackets, while larger back marks or sleeve hits can fit events and merch drops.
              We help translate artwork into a jacket layout that stays readable at real garment size.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {details.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-md border bg-card p-3 text-sm font-medium">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <Card className="rounded-lg">
            <CardContent className="p-6">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <h3 className="mt-5 text-2xl font-bold">Professional finish</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Choose understated left-chest embroidery, sleeve marks, woven labels, or bolder decoration for event merchandise.
              </p>
              <Button asChild className="mt-6">
                <Link href="/contact?topic=corporate-office-orders">Talk to Jacketee</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <BulkOrderResources kind="corporate" />

        <section className="border-t bg-zinc-950 text-white">
          <div className="container mx-auto grid gap-6 px-4 py-12 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-bold">Need jackets for your company?</h2>
              <p className="mt-3 text-white/70">Send your logo, quantity, style direction, and target date.</p>
            </div>
            <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
              <Link href="/contact?topic=corporate-office-orders">Request Quote</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
