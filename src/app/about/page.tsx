import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Factory, Mail, MapPin, Phone } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const heroImage = 'https://res.cloudinary.com/dhdfbl8pc/image/upload/v1788899943/clothaa/exports/patches-embroidery/hero__varsity-jacket-patches-embroidery-hero.jpg'

export const metadata: Metadata = {
  title: 'About Jacketee | Custom Jacket Factory & Team',
  description: 'Meet Jacketee, founded in 2026 in Sialkot, Pakistan. Learn about our in-house jacket production, customization options, and customer support.',
  alternates: { canonical: `${siteUrl}/about` },
  openGraph: {
    title: 'About Jacketee',
    description: 'Jacketee makes custom jackets in its own factory in Sialkot, Pakistan, with in-house cutting, stitching, embroidery, quality checks, and packing.',
    url: `${siteUrl}/about`,
    siteName: 'Jacketee',
    type: 'website',
    images: [{ url: heroImage, alt: 'Custom varsity jacket with patches and embroidery' }],
  },
}

const orderSteps = [
  ['Choose a starting style', 'Browse varsity, bomber, leather, puffer, denim, and other jacket options.'],
  ['Plan the details', 'Compare materials and colors, then decide on patches, embroidery, names, or numbers.'],
  ['Review your order', 'For bulk work, share your quantity, sizes, artwork, deadline, and destination so the team can prepare a quote and proof.'],
  ['Move to production', 'Once the specifications are approved, the order moves through production, quality checks, and shipping.'],
]

const audiences = [
  { title: 'Schools & teams', text: 'Varsity jackets for classes, clubs, teams, and achievement programs.', href: '/bulk-orders/schools' },
  { title: 'Companies', text: 'Branded jackets for staff, events, uniforms, and merchandise.', href: '/bulk-orders/corporate' },
  { title: 'Private labels', text: 'Jacket programs planned around your branding, labels, samples, and repeat orders.', href: '/bulk-orders/private-label' },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative flex min-h-[430px] items-center overflow-hidden bg-zinc-950 text-white md:min-h-[520px]">
          <Image src={heroImage} alt="Custom varsity jacket with patches and embroidery" fill priority sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-black/55" />
          <div className="container relative mx-auto px-4 py-14">
            <Breadcrumbs items={[{ label: 'About' }]} className="mb-8 text-white/80" />
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold md:text-6xl">About Jacketee</h1>
              <p className="mt-5 text-base leading-8 text-white/90 md:text-lg">
                Founded in 2026, Jacketee makes custom jackets for individuals, teams, schools, organizations, and brands from our own factory in Sialkot, Pakistan.
              </p>
              <Link href="/shop" className="mt-7 inline-flex h-11 items-center gap-2 bg-white px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-white/90">
                Explore jackets <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b bg-background py-12 md:py-16">
          <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="text-sm font-semibold uppercase text-muted-foreground">Our story</p>
              <h2 className="mt-2 text-2xl font-bold md:text-3xl">Built in Sialkot, made for your idea</h2>
            </div>
            <div className="space-y-5 leading-7 text-muted-foreground">
              <p>Jacketee was founded in 2026 to make custom jacket ordering clearer. Customers can choose a style, compare materials and colors, and personalize their jacket with logos, names, numbers, embroidery, and custom patches.</p>
              <p>We are based in Adalat Garh, Sialkot, Punjab, Pakistan. Sialkot has an established manufacturing and export community spanning leather products, jackets, gloves, sportswear, and textiles. Jacketee builds on that local production knowledge while serving modern individual and group orders.</p>
            </div>
          </div>
        </section>

        <section className="border-b bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <Factory className="h-7 w-7" />
              <h2 className="mt-4 text-2xl font-bold md:text-3xl">Production under our roof</h2>
              <p className="mt-4 leading-7 text-muted-foreground">Our factory handles pattern preparation and cutting, stitching and assembly, embroidery, custom patchwork, quality checks, and packing. We also work with trusted material suppliers and production partners when a project requires specialist support or sourcing.</p>
            </div>
            <div className="mt-8 grid gap-x-8 gap-y-4 border-t pt-7 sm:grid-cols-2 lg:grid-cols-3">
              {['Pattern preparation & cutting', 'Stitching & assembly', 'Embroidery', 'Custom patchwork', 'Quality checks', 'Packing'].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-medium"><CheckCircle2 className="h-4 w-4 shrink-0" /><span>{item}</span></div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b bg-background py-12 md:py-16">
          <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Made around your brief</h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                The catalog covers varsity and letterman styles alongside bomber, leather, puffer, denim, coach, and fleece options. The right starting point depends on how the jacket will be worn and what it needs to represent.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="border-l-2 border-foreground pl-5">
                <h3 className="font-semibold">Materials & colors</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Compare fabric, finish, and color choices before settling on a design.</p>
                <Link href="/materials-colors" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">Explore materials <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="border-l-2 border-foreground pl-5">
                <h3 className="font-semibold">Patches & embroidery</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Add lettering, logos, names, and other details to make a jacket specific to your group or brand.</p>
                <Link href="/patches-embroidery" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">See custom options <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold md:text-3xl">How an order takes shape</h2>
            <div className="mt-8 grid gap-7 border-t pt-7 sm:grid-cols-2 lg:grid-cols-4">
              {orderSteps.map(([title, text], index) => (
                <div key={title}>
                  <span className="text-sm font-semibold text-muted-foreground">0{index + 1}</span>
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b bg-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold md:text-3xl">Jackets for groups and brands</h2>
                <p className="mt-3 max-w-2xl text-muted-foreground">Bulk orders have different artwork, sizing, and delivery needs. Start with the path that fits your project.</p>
              </div>
              <Link href="/bulk-orders" className="inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">All bulk orders <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-8 grid gap-7 border-t pt-7 md:grid-cols-3">
              {audiences.map((audience) => (
                <Link key={audience.href} href={audience.href} className="group border-b pb-6">
                  <h3 className="text-lg font-semibold group-hover:underline">{audience.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{audience.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">Learn more <ArrowRight className="h-4 w-4" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b bg-muted/20 py-12 md:py-16">
          <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Details before you order</h2>
              <p className="mt-3 leading-7 text-muted-foreground">Use the published guides to check sizing and policies before committing to a jacket or a group order.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['/size-guide', 'Size guide'],
                ['/shipping', 'Shipping & delivery'],
                ['/returns', 'Returns & exchanges'],
                ['/faq', 'Frequently asked questions'],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="flex items-center justify-between gap-3 border-b py-3 text-sm font-medium hover:text-primary">
                  <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{label}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-zinc-950 py-12 text-white md:py-16">
          <div className="container mx-auto grid gap-8 px-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Talk to Jacketee</h2>
              <p className="mt-3 max-w-xl text-white/70">Have a design, sizing, or bulk-order question? Tell us what you are planning and we will help you find the next step.</p>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
                <a href="mailto:info@jacketee.com" className="inline-flex items-center gap-2 hover:text-white"><Mail className="h-4 w-4" />info@jacketee.com</a>
                <a href="tel:+923187328027" className="inline-flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4" />+92 318 7328027</a>
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />Adalat Garh, Sialkot, Punjab, Pakistan</span>
              </div>
            </div>
            <Link href="/contact" className="inline-flex h-11 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-zinc-950 hover:bg-white/90">Contact us <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
