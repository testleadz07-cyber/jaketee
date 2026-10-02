import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileCheck,
  HelpCircle,
  Layers,
  Palette,
  Ruler,
  Scissors,
  Sliders,
  Sparkles,
  ShieldCheck,
  Upload,
  Wand2,
} from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const PAGE_URL = `${SITE_URL}/how-to-customize`

export const metadata: Metadata = {
  title: 'How to Customize a Jacket | Step-by-Step Customization Guide | Jacketee',
  description:
    'Learn how to design and customize your selected jacket on Jacketee. Follow our easy 6-step guide to pick materials, colors, chenille patches, embroidery, custom sizing, and artwork.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'How to Customize Your Jacket | Jacketee Customization Guide',
    description:
      'Step-by-step guide to creating your personalized varsity, bomber, denim, or leather jacket. Choose materials, artwork placement, custom patches, and exact measurements.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Customize Your Jacket | Step-by-Step Guide | Jacketee',
    description:
      'Learn how to customize any jacket on Jacketee with our simple 6-step builder guide.',
  },
}

const customizationSteps = [
  {
    number: '01',
    title: 'Select Your Base Jacket Style',
    icon: Wand2,
    tagline: 'Choose from varsity, bomber, denim, puffer, or leather bases',
    description:
      'Browse our catalog or select any customizable jacket. Each jacket design serves as your canvas, offering premium construction, tailored cuts, and built-in customization options.',
    details: [
      'Pick your foundational category (Varsity Letterman, Vintage Bomber, Heavyweight Denim, Quilted Puffer, etc.).',
      'Click the "Customize This Jacket" button on the product detail page to launch the interactive customizer.',
      'You can also start from scratch or pick a pre-designed template to adjust colors and patches.',
    ],
    tip: 'Pro Tip: Select a base style that matches your climate and event needs (e.g., Melton Wool & Genuine Leather for classic varsity, Cotton Satin for lightweight team jackets).',
  },
  {
    number: '02',
    title: 'Choose Materials, Colors & Hardware',
    icon: Palette,
    tagline: 'Personalize body fabric, sleeves, lining, and metal trims',
    description:
      'Fine-tune every visual component of your jacket. Select primary and secondary colorways, inner linings, and hardware finishes to reflect your personal style or team identity.',
    details: [
      'Body & Sleeve Fabrics: Combine wool body with leather sleeves, or select 100% all-wool, satin, or twill.',
      'Color Palette: Pick contrast colors for body, sleeves, collar, cuffs, and waist ribbing.',
      'Lining & Hardware: Choose quilted thermal lining, sleek satin, or lightweight mesh, plus brass or silver snap closures.',
    ],
    tip: 'Matching Tip: Ribbing stripes can combine up to 3 colors to align perfectly with school, brand, or club palettes.',
  },
  {
    number: '03',
    title: 'Add Patches, Embroidery & Text',
    icon: Scissors,
    tagline: 'Place chenille letters, felt patches, and embroidered artwork',
    description:
      'Make your jacket unique with multi-layer chenille letters, high-density embroidery, tackle twill graphics, or custom printed patches across key placement zones.',
    details: [
      'Chest Details: Add left chest varsity letters, graduation year digits, or custom script name embroidery.',
      'Sleeve Artwork: Place jersey numbers, state flags, award patches, or team emblems on left and right sleeves.',
      'Back Statement: Feature large multi-tier chenille lettering, mascot patches, or full-width embroidered crests.',
      'Custom Uploads: Upload your high-res logo or artwork file (PNG, SVG, AI, PDF) directly in the builder.',
    ],
    tip: 'Design Tip: Traditional letterman jackets feature 3D fluffy chenille patches, while corporate or streetwear lines look sharp with flat direct-to-garment embroidery.',
  },
  {
    number: '04',
    title: 'Specify Size & Custom Measurements',
    icon: Ruler,
    tagline: 'Standard US/EU sizing or made-to-measure custom dimensions',
    description:
      'Ensure a flawless fit. Choose standard sizing from XS to 6XL, or submit custom measurements for a tailor-made jacket tailored specifically to your body profile.',
    details: [
      'Standard Sizing: Pick your normal size using our comprehensive Size Guide with chest, shoulder, and sleeve charts.',
      'Custom Tailored Fit: Enter exact body measurements (chest width, shoulder width, sleeve length, jacket length).',
      'Fit Preference: Choose between standard fit, relaxed athletic fit, or modern oversized streetwear silhouette.',
    ],
    tip: 'Fit Tip: If planning to wear heavy hoodies or sweaters under your jacket, we recommend selecting one size up or measuring with outerwear layers on.',
  },
  {
    number: '05',
    title: 'Review Mockup & Instant Price Summary',
    icon: Sliders,
    tagline: 'Transparent pricing with live design preview',
    description:
      'Inspect every detail of your build before placing your order. Our interactive customizer updates total cost in real-time with zero hidden customization fees.',
    details: [
      'Review placement summary: Check chest text, sleeve patches, back artwork, and selected sizes.',
      'Add Special Instructions: Include design notes, thread color preferences, or specific patch dimensions.',
      'Transparent Price Breakdown: See base price plus any added patch or specialty material costs.',
    ],
    tip: 'Ordering Tip: No minimum order quantity is required! Order 1 piece for yourself or batch orders for entire groups.',
  },
  {
    number: '06',
    title: 'Free Digital Proof & Crafting',
    icon: ShieldCheck,
    tagline: 'Approved by you before production begins',
    description:
      'Once you place your order, our professional design team crafts a detailed 3D digital mockup for your final review and sign-off within 24 hours.',
    details: [
      'Free Mockup Approval: We send a high-resolution mockup to your email before cutting any fabric.',
      'Unlimited Revisions: Request minor adjustments to placement, sizing, or colors until it is 100% right.',
      'Master Craftsmanship & Shipping: Once approved, master tailors craft your jacket with premium materials and ship it direct to your door.',
    ],
    tip: 'Peace of Mind: Production only begins after you give 100% explicit approval on your digital proof.',
  },
]

const placementZones = [
  {
    zone: 'Left & Right Chest',
    description: 'Ideal for school letters, individual names, graduation year, or small brand logos.',
  },
  {
    zone: 'Left & Right Sleeves',
    description: 'Perfect for jersey numbers, position titles, squad badges, or state/national flags.',
  },
  {
    zone: 'Upper & Lower Back',
    description: 'Designed for bold team titles, arched organization names, or large central mascots.',
  },
  {
    zone: 'Inner Pocket / Lining',
    description: 'Discreet space for custom woven tags, interior name patches, or commemorative dates.',
  },
]

const faqs = [
  {
    question: 'How do I start customizing a jacket on Jacketee?',
    answer:
      'Simply browse our site, find any jacket style you like, and click the "Customize This Jacket" button. This launches our step-by-step customization builder where you can choose fabrics, colors, patches, text, and sizing.',
  },
  {
    question: 'Can I upload my own custom logo or design?',
    answer:
      'Yes! In Step 3 (Design & Artwork), you can upload your vector file or high-resolution image (PNG, SVG, PDF, or AI). Our design team will digitize your logo into patch embroidery or chenille artwork.',
  },
  {
    question: 'Will I see a proof before my jacket is produced?',
    answer:
      'Absolutely. Every custom jacket order includes a free high-resolution digital mockup proof created by our design team within 24 hours. Production only starts after you approve the final proof.',
  },
  {
    question: 'What if I am between sizes or need custom dimensions?',
    answer:
      'We offer custom made-to-measure sizing! In Step 4 (Sizing), choose "Custom Measurements" and input your chest circumference, shoulder width, sleeve length, and jacket length for a tailored fit.',
  },
  {
    question: 'Is there a minimum order quantity (MOQ)?',
    answer:
      'No! We have no minimum order requirement. You can order a single custom 1-of-1 jacket or bulk orders for teams, schools, and organizations with volume discounts.',
  },
  {
    question: 'How long does custom jacket production and shipping take?',
    answer:
      'Once your mockup is approved, production typically takes 2 to 3 weeks. Express shipping usually delivers within 5 to 7 business days worldwide.',
  },
]

export default function HowToCustomizePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Customize a Jacket on Jacketee',
    description:
      'A step-by-step guide explaining how to design, customize, size, and order a custom jacket on Jacketee.',
    step: customizationSteps.map((step, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: step.title,
      text: step.description,
    })),
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <main>
        {/* Breadcrumb Bar */}
        <div className="border-b bg-muted/40 py-3">
          <div className="container mx-auto px-4">
            <Breadcrumbs
              items={[
                { label: 'Support', href: '/faq' },
                { label: 'How to Customize a Jacket' },
              ]}
            />
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background py-14 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="outline" className="mb-4 inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Step-by-Step Customization Guide
            </Badge>

            <h1 className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              How to Customize Your Selected Jacket on Jacketee
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              Follow our simple 6-step process to design your dream custom letterman, bomber, denim, or puffer jacket. Personalize materials, patches, embroidery, and exact sizing with ease.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="rounded-full px-8 font-semibold shadow-lg transition-transform hover:scale-105">
                <Link href="/custom-letterman-jackets">
                  Design a Custom Jacket Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="rounded-full px-7 font-medium">
                <Link href="/materials-colors">Explore Fabrics & Colors</Link>
              </Button>
            </div>

            {/* Quick Stats / Highlights */}
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl mx-auto">
              <div className="rounded-xl border bg-card/60 p-4 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-xs text-muted-foreground mt-1">Customizable Options</div>
              </div>
              <div className="rounded-xl border bg-card/60 p-4 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold text-primary">No MOQ</div>
                <div className="text-xs text-muted-foreground mt-1">Order 1 or 1,000+</div>
              </div>
              <div className="rounded-xl border bg-card/60 p-4 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold text-primary">Free Proof</div>
                <div className="text-xs text-muted-foreground mt-1">Digital 3D Mockup</div>
              </div>
              <div className="rounded-xl border bg-card/60 p-4 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold text-primary">XS – 6XL</div>
                <div className="text-xs text-muted-foreground mt-1">Or Tailored Measurements</div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed 6 Steps Section */}
        <section className="py-14 md:py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold tracking-tight md:text-4xl">
                The 6 Steps to Create Your Custom Jacket
              </h2>
              <p className="mt-3 text-muted-foreground">
                Our intuitive jacket customizer makes it effortless to bring your vision to life.
              </p>
            </div>

            <div className="space-y-10 md:space-y-14">
              {customizationSteps.map((step, index) => {
                const IconComponent = step.icon
                return (
                  <div
                    key={step.number}
                    className="relative overflow-hidden rounded-2xl border bg-card p-6 md:p-8 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:gap-8">
                      {/* Step Number & Icon badge */}
                      <div className="mb-4 flex items-center gap-4 md:mb-0 md:flex-col md:items-center">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-extrabold shadow">
                          {step.number}
                        </span>
                        <div className="rounded-xl bg-primary/10 p-3 text-primary hidden md:block">
                          <IconComponent className="h-6 w-6" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs font-semibold">
                            Step {index + 1} of 6
                          </Badge>
                          <span className="text-xs font-medium text-muted-foreground">
                            {step.tagline}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold md:text-2xl text-foreground">
                          {step.title}
                        </h3>

                        <p className="mt-3 leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>

                        <div className="mt-4 rounded-lg bg-muted/50 p-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                            Key Actions & Options
                          </h4>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            {step.details.map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-2.5">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Pro Tip Box */}
                        <div className="mt-4 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs md:text-sm text-foreground">
                          <Sparkles className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                          <div>
                            <span className="font-semibold text-primary">Pro Tip: </span>
                            {step.tip.replace('Pro Tip: ', '').replace('Matching Tip: ', '').replace('Design Tip: ', '').replace('Fit Tip: ', '').replace('Ordering Tip: ', '').replace('Peace of Mind: ', '')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Patch & Artwork Placement Guide */}
        <section className="border-t bg-muted/30 py-14 md:py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="mb-12 text-center">
              <Badge variant="outline" className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
                Placement Overview
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight md:text-4xl">
                Where Can You Place Custom Details?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Our customization engine allows precision placement across all standard zones of your jacket.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {placementZones.map((zone, idx) => (
                <Card key={idx} className="border bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Scissors className="h-5 w-5 text-primary" /> {zone.zone}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {zone.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border bg-card p-6 md:p-8 text-center shadow-sm">
              <h3 className="text-xl font-bold">Have Special Design Requirements?</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
                Need extra patch positions, unique sleeve striping, custom interior woven tags, or specific Pantone thread matching? Contact our support or design team anytime.
              </p>
              <div className="mt-5 flex justify-center gap-4">
                <Button asChild variant="outline" size="sm">
                  <Link href="/patches-embroidery">View Patch Types & Embroidery</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="border-t py-14 md:py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="mb-12 text-center">
              <Badge variant="outline" className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
                Customization FAQ
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight md:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-muted-foreground">
                Common questions about designing and ordering custom jackets on Jacketee.
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="rounded-xl border bg-card px-6 py-2 shadow-sm"
                >
                  <AccordionTrigger className="text-left font-semibold text-base hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-sm pt-2">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="border-t bg-primary text-primary-foreground py-14 md:py-16">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-2xl font-extrabold sm:text-3xl md:text-4xl">
              Ready to Customize Your Jacket?
            </h2>
            <p className="mt-4 text-primary-foreground/90 text-base md:text-lg">
              Start building your custom jacket right now with our interactive design tool. Get free mockups, custom sizing, and premium quality craftsmanship.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="rounded-full px-8 font-bold shadow-md hover:bg-background hover:text-foreground"
              >
                <Link href="/custom-letterman-jackets">
                  Start Customizing Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full px-7 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link href="/size-guide">View Size Guide</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
