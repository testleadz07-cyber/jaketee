import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, CalendarDays, GraduationCap, ListChecks, Palette, Shirt, Users } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'
const PAGE_URL = `${SITE_URL}/bulk-orders/schools`

export const metadata: Metadata = {
  title: 'School Varsity Jacket Bulk Orders | Jacketee',
  description:
    'Bulk varsity jacket ordering for schools, teams, clubs, seniors, alumni, and achievement programs. Plan sizing, colors, patches, names, and numbers.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'School Varsity Jacket Bulk Orders | Jacketee',
    description: 'Plan a school or team varsity jacket order with names, numbers, patches, colors, and size collection.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
}

const useCases = ['Senior class jackets', 'Sports team jackets', 'Club and society apparel', 'Alumni programs', 'Staff and coach jackets', 'Academic award jackets']

const planning = [
  ['Roster', 'Collect names, sizes, numbers, positions, and any personalization rules before proof approval.'],
  ['School colors', 'Confirm body, sleeve, rib, snap, lining, and thread colors against your official palette.'],
  ['Patch layout', 'Decide where letters, mascots, graduation years, names, and sleeve awards should sit.'],
  ['Deadline', 'Work backward from game day, senior week, graduation, or event date.'],
]

const timeline = [
  ['Brief', 'Share quantity, deadline, jacket type, and basic decoration needs.'],
  ['Artwork', 'Send mascot, school crest, letters, names, numbers, and placement notes.'],
  ['Proof', 'Review digital mockups, spelling, colors, and decoration positions.'],
  ['Production', 'Approved orders move through materials, decoration, sewing, QC, and shipping.'],
]

export default function SchoolBulkOrdersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="border-b bg-zinc-950 text-white">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <Breadcrumbs
              items={[{ label: 'Bulk Orders', href: '/bulk-orders' }, { label: 'Schools' }]}
              className="mb-8 text-white/70"
            />
            <div className="max-w-3xl">
              <Badge className="mb-5 bg-white/10 text-white hover:bg-white/10">Schools, teams, and clubs</Badge>
              <h1 className="text-4xl font-black leading-tight md:text-6xl">School Varsity Jacket Bulk Orders</h1>
              <p className="mt-6 text-lg leading-8 text-white/75">
                Organize class, team, club, and alumni jackets with consistent colors, clean artwork, clear sizing, and personalization rules.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
                  <Link href="/contact?topic=school-bulk-orders">
                    Request School Quote
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                  <Link href="/varsity-jackets">Shop Varsity Jackets</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [GraduationCap, 'School identity', 'Keep official colors, crests, letters, mascots, and class years consistent.'],
              [Users, 'Roster control', 'Plan personalized names, numbers, roles, and size collection before production.'],
              [Palette, 'Custom finishes', 'Choose wool, leather, satin, rib colors, patches, embroidery, and lining options.'],
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
              <p className="text-sm font-bold uppercase tracking-wide text-primary">Common programs</p>
              <h2 className="mt-2 text-3xl font-bold">Built for school-year ordering</h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                School jacket orders usually need careful spelling, color control, and a single approved proof before production begins.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {useCases.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-md border bg-background p-4 text-sm font-semibold">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-2 md:py-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Planning checklist</p>
            <h2 className="mt-2 text-3xl font-bold">Details to settle early</h2>
            <div className="mt-6 space-y-3">
              {planning.map(([title, text]) => (
                <div key={title} className="rounded-lg border bg-card p-5">
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Order flow</p>
            <h2 className="mt-2 text-3xl font-bold">From roster to delivery</h2>
            <div className="mt-6 space-y-3">
              {timeline.map(([title, text], index) => (
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
        </section>

        <section className="border-t bg-zinc-950 text-white">
          <div className="container mx-auto grid gap-6 px-4 py-12 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-bold">Ready to plan your school order?</h2>
              <p className="mt-3 text-white/70">Send your quantity range, deadline, artwork, and school color notes.</p>
            </div>
            <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
              <Link href="/contact?topic=school-bulk-orders">Start School Quote</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
