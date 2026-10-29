export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from '@/components/optimized-image'
import { ArrowRight, Check, ChevronDown, Palette, Ruler, Scissors, ShieldCheck } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { getCustomDesignImages } from '@/components/custom-design-section'
import { fulfillmentConfig } from '@/config/fulfillment'
import { withSocialMetadata } from '@/lib/seo-metadata'

export const revalidate = 3600

const PAGE_URL = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'}/how-to-customize`
const description = 'Customize a jacket online: choose a style, use its design tool, add names or artwork, compare materials, check sizing and review your design before ordering.'
export const metadata: Metadata = withSocialMetadata({
  title: 'How to Customize a Jacket Online: Design Guide | Jacketee',
  description,
  alternates: { canonical: PAGE_URL },
  openGraph: { title: 'How to Customize Your Jacket | Jacketee Customization Guide', description, url: PAGE_URL, siteName: 'Jacketee', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'How to Customize Your Jacket | Step-by-Step Guide | Jacketee', description },
})

const styles = [
  { name: 'Varsity', href: '/design/varsity', detail: 'Classic letters & contrast sleeves' },
  { name: 'Bomber', href: '/design/bomber', detail: 'A clean canvas for your identity' },
  { name: 'Coach', href: '/design/coach', detail: 'Lightweight team style' },
  { name: 'Puffer', href: '/design/puffer', detail: 'Personalized cold-weather layers' },
  { name: 'Fleece hoodie', href: '/design/hoodie', detail: 'Everyday comfort, made yours' },
]
const steps = [
  { id: 'choose-style', short: 'Choose a style', title: 'Start with the right base', text: 'Choose a jacket or hoodie below to open its designer. Available materials, finishing options and sizes depend on the style you select.', actions: ['Think about your climate, occasion and how you want to layer.', 'For denim or a special construction, discuss your requirements with our team.'], link: '/custom-denim-jackets', label: 'Explore custom denim', tip: 'Not every style has the same options. Use the controls in your chosen designer as your guide.' },
  { id: 'materials-colors', short: 'Materials & colors', title: 'Build your color palette', text: 'Choose from the material and color controls available for your style. Start with the body and sleeves, then coordinate the trim and finishing details.', actions: ['Keep your main colors consistent with your school, team or brand.', 'Review the front and back preview after changing colors.'], link: '/materials-colors', label: 'Compare materials & colors', tip: 'Screen colors are a guide. Ask our team about a specific shade before ordering if an exact match matters.' },
  { id: 'add-artwork', short: 'Text & artwork', title: 'Add the details that tell your story', text: 'Personalize the available views with names, numbers, lettering or uploaded artwork. Check placement and scale as you go.', actions: ['Use your clearest original logo or artwork, rather than a screenshot.', 'Check spelling, graduation years, numbers and artwork on each view.'], link: '/patches-embroidery', label: 'Compare patches & embroidery', tip: 'Keep small text simple and legible. Ask for help with artwork that has fine detail, gradients or a background you want removed.' },
  { id: 'check-size', short: 'Check your size', title: 'Measure before choosing your fit', text: 'Compare the size guide with a jacket that already fits you well. Consider the layers you plan to wear underneath.', actions: ['Check chest, shoulder, sleeve and jacket length using the guide.', 'Contact us before ordering if you are between sizes or need custom measurements.'], link: '/size-guide', label: 'Open the size guide', tip: 'Avoid guessing or automatically sizing up. Use measurements and the style’s available size options to decide.' },
  { id: 'review-order', short: 'Review & order', title: 'Give every detail a final check', text: 'Review the jacket preview, selected options, size and price summary before continuing to your cart or checkout.', actions: ['Check all views, colors, text and uploaded artwork.', 'Review the shipping charge, delivery address and contact details at checkout.'], link: '/shipping', label: 'Read shipping information', tip: 'The designer shows the price for your selected options. Shipping is calculated at checkout; request a quote for group orders.' },
  { id: 'approval-delivery', short: 'Approval & delivery', title: 'Approve your design before production', text: 'Review the design proof and confirm any adjustments with our team before your jacket is made. Keep your order details handy for follow-up questions.', actions: [fulfillmentConfig.individualProduction, fulfillmentConfig.individualDelivery], link: '/track-order', label: 'Track an existing order', tip: `${fulfillmentConfig.bulkProductionDelivery} Tell us your required event date before ordering.` },
]
const faqs = [
  { question: 'Which styles can I customize online?', answer: 'You can open an online designer for varsity, bomber, coach and puffer jackets, plus fleece hoodies. For denim or a special request, contact our team to discuss your design.' },
  { question: 'How do I use the jacket customization tool?', answer: 'Choose a style to open its designer, then work through the available material, color, text and artwork options. Review every available view, check your size and selected options, and review the price summary before ordering. Available controls and placements depend on the jacket style.' },
  { question: 'Do I need finished artwork to get started?', answer: 'No. You can start by choosing your style and colors and adding text. If your logo needs preparation or you only have an idea, contact us before ordering so we can discuss the best way to reproduce it.' },
  { question: 'Can I choose any fabric, lining or hardware?', answer: 'Options vary by style. Choose from the controls shown in your selected designer. For a material, closure, lining or other detail that is not listed, ask our team before placing your order.' },
  { question: 'Can I request custom measurements?', answer: 'Use the size guide first, then contact our team before ordering if the listed sizes do not suit you. Confirm custom measurements and availability for your chosen style with us.' },
  { question: 'Will I see my design before production?', answer: 'You can review your design in the online preview while you customize. Review the proof with our team and confirm your design before production begins.' },
  { question: 'How long does a custom jacket take?', answer: `${fulfillmentConfig.individualProduction} ${fulfillmentConfig.individualDelivery} ${fulfillmentConfig.bulkProductionDelivery}` },
  { question: 'How do I order for a team or school?', answer: 'Use the Bulk & Teams quote form for group orders. Prepare your approximate quantity, style, artwork, size requirements and event date so our team can provide a relevant quote.' },
]
const resources = [
  { title: 'Materials & colors', text: 'Compare fabrics, leather and color ranges.', href: '/materials-colors', icon: Palette },
  { title: 'Patches & embroidery', text: 'Choose the finish that suits your artwork.', href: '/patches-embroidery', icon: Scissors },
  { title: 'Size guide', text: 'Measure a jacket you already love wearing.', href: '/size-guide', icon: Ruler },
]

export default async function HowToCustomizePage() {
  const images = await getCustomDesignImages()
  const hero = images.varsity
  const schema = [
    { '@context': 'https://schema.org', '@type': 'HowTo', name: 'How to Customize a Jacket on Jacketee', description, step: steps.map((step, index) => ({ '@type': 'HowToStep', position: index + 1, name: step.title, text: step.text, url: `${PAGE_URL}#${step.id}` })) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) },
  ]
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
        <div className="container mx-auto px-4 py-5"><Breadcrumbs items={[{ label: 'Support', href: '/faq' }, { label: 'How to Customize a Jacket' }]} /></div>
        <section className="container mx-auto px-4 pb-10 md:pb-16" aria-labelledby="customize-title">
          <div className="grid overflow-hidden rounded-2xl border bg-muted/25 lg:grid-cols-2">
            <div className="p-6 sm:p-10 lg:self-center lg:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Your idea. Your jacket.</p>
              <h1 id="customize-title" className="mt-4 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">How to customize<br className="hidden sm:block" /> your jacket</h1>
              <p className="mt-5 max-w-xl leading-7 text-muted-foreground">From your first color choice to the final design approval. Follow six simple steps to create a custom jacket with your colors, lettering, patches and embroidery.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild size="lg"><a href="#choose-your-style">Choose your style <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
                <Button asChild size="lg" variant="outline"><a href="#customization-steps">See the 6 steps</a></Button>
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" /> Review your design before production</p>
            </div>
            <div className="relative min-h-72 bg-muted/40 sm:min-h-96 lg:min-h-[480px]">
              {hero && <Image src={hero.url} alt={hero.alt} fill priority sizes="(max-width: 1023px) 100vw, 50vw" className="object-contain p-6 sm:p-10" />}
            </div>
          </div>
        </section>

        <section id="choose-your-style" aria-labelledby="style-title" className="container mx-auto scroll-mt-28 px-4 pb-12 md:pb-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start here</p>
          <h2 id="style-title" className="mt-2 text-2xl font-bold sm:text-3xl">Pick your canvas</h2>
          <ul className="mt-4 max-w-3xl space-y-2 text-muted-foreground">
            {[
              'Choose your jacket style below.',
              'Select materials and colors.',
              'Add your text or artwork.',
              'Review your design from every available view.',
              'Check your size and price before ordering.',
            ].map(step => <li key={step} className="flex items-start gap-3 leading-7"><Check aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" /><span>{step}</span></li>)}
          </ul>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">The preview helps you plan your jacket. Final details are confirmed before production.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {styles.map(style => <Link key={style.href} href={style.href} className="group flex items-center justify-between gap-3 rounded-xl border bg-card p-5 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"><div><h3 className="font-semibold">{style.name}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{style.detail}</p><span className="mt-3 inline-block text-sm font-medium text-primary">Open designer</span></div><ArrowRight className="h-4 w-4 shrink-0 text-primary" /></Link>)}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Planning for a group? <Link href="/bulk-orders" className="font-medium text-foreground underline underline-offset-4">Request a Bulk & Teams quote</Link>.</p>
        </section>

        <section id="customization-steps" className="border-y bg-muted/20" aria-labelledby="steps-title">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <h2 id="steps-title" className="text-2xl font-bold sm:text-3xl">Your design, step by step</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">Use this guide alongside the designer. Jump to the part you need help with.</p>
            <div className="mt-8 grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
              <nav aria-label="Customization steps" className="rounded-xl border bg-background p-3 lg:sticky lg:top-28">
                <ol className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">{steps.map((step, index) => <li key={step.id}><a href={`#${step.id}`} className="flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>{step.short}</a></li>)}</ol>
              </nav>
              <ol className="min-w-0 space-y-5">
                {steps.map((step, index) => <li id={step.id} key={step.id} className="scroll-mt-28 rounded-xl border bg-card p-5 sm:p-7">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Step {index + 1} of 6</p>
                  <h3 className="mt-2 text-xl font-semibold sm:text-2xl">{step.title}</h3>
                  <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{step.text}</p>
                  <ul className="mt-4 space-y-3">{step.actions.map(action => <li key={action} className="flex gap-3 text-sm leading-6"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" /><span>{action}</span></li>)}</ul>
                  <Link href={step.link} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline">{step.label}<ArrowRight className="h-4 w-4" /></Link>
                  <Collapsible className="group mt-3 border-t">
                    <CollapsibleTrigger className="flex min-h-12 w-full items-center justify-between gap-3 text-left text-sm font-medium">Helpful tip: {step.short.toLowerCase()}<ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" /></CollapsibleTrigger>
                    <CollapsibleContent forceMount className="pb-3 text-sm leading-6 text-muted-foreground data-[state=closed]:hidden">{step.tip}</CollapsibleContent>
                  </Collapsible>
                </li>)}
              </ol>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16" aria-labelledby="prepare-title">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div><h2 id="prepare-title" className="text-2xl font-bold sm:text-3xl">A little preparation goes a long way</h2><p className="mt-3 leading-7 text-muted-foreground">You can explore the designer straight away. Have these details ready when you’re ready to order or request design help.</p>
              <ul className="mt-5 space-y-3">{['Your preferred style and main colors', 'Names, numbers and artwork with checked spelling', 'Your size or the measurements you want to discuss', 'Quantity and any important event date'].map(item => <li key={item} className="flex gap-3 text-sm leading-6"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" />{item}</li>)}</ul>
            </div>
            <div className="rounded-xl border bg-muted/25 p-6"><h3 className="text-lg font-semibold">Plan where your artwork will go</h3><dl className="mt-4 space-y-4">{[['Chest', 'Names, small logos and varsity letters.'], ['Sleeves', 'Numbers, badges and smaller accents.'], ['Back', 'Team names, mascots and larger statements.']].map(([zone, text]) => <div key={zone} className="border-b pb-4 last:border-0 last:pb-0"><dt className="text-sm font-semibold">{zone}</dt><dd className="mt-1 text-sm leading-6 text-muted-foreground">{text}</dd></div>)}</dl><p className="mt-5 text-xs leading-5 text-muted-foreground">Available placement areas vary by style and construction. Confirm special positions or interior labels with our team.</p></div>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">{resources.map(({ title, text, href, icon: Icon }) => <Link key={href} href={href} className="rounded-xl border p-5 transition-colors hover:bg-muted/40"><Icon className="h-5 w-5 text-primary" /><h3 className="mt-4 flex items-center justify-between gap-3 font-semibold">{title}<ArrowRight className="h-4 w-4" /></h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></Link>)}</div>
        </section>

        <section className="border-t bg-muted/20 px-4 py-12 md:py-16" aria-labelledby="faq-title">
          <div className="mx-auto max-w-3xl"><h2 id="faq-title" className="text-2xl font-bold sm:text-3xl">Before you start</h2><p className="mt-3 text-muted-foreground">Answers to common customization questions.</p><Accordion type="multiple" className="mt-6">{faqs.map((faq, index) => <AccordionItem key={faq.question} value={`customize-faq-${index}`}><AccordionTrigger className="min-h-14 text-left text-base">{faq.question}</AccordionTrigger><AccordionContent className="text-sm leading-7 text-muted-foreground">{faq.answer}</AccordionContent></AccordionItem>)}</Accordion><Link href="/faq" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">Visit the help center<ArrowRight className="h-4 w-4" /></Link></div>
        </section>
        <section className="container mx-auto px-4 py-12 md:py-16" aria-labelledby="ready-title"><div className="flex flex-col justify-between gap-6 rounded-2xl bg-primary/5 p-6 sm:p-10 lg:flex-row lg:items-center"><div><h2 id="ready-title" className="text-2xl font-bold sm:text-3xl">Ready to make it yours?</h2><p className="mt-3 text-muted-foreground">Start with your favorite style, or talk through your idea with us.</p></div><div className="flex shrink-0 flex-col gap-3 sm:flex-row"><Button asChild size="lg"><a href="#choose-your-style">Build your jacket<ArrowRight className="ml-2 h-4 w-4" /></a></Button><Button asChild variant="outline" size="lg"><Link href="/contact">Get design help</Link></Button></div></div></section>
      </main>
      <Footer />
    </div>
  )
}
