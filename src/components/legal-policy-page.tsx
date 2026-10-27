import Link from 'next/link'
import { ArrowRight, Mail } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import type { SitePolicy } from '@/data/site-policies'

export function LegalPolicyPage({ policy }: { policy: SitePolicy }) {
  return <div className="flex min-h-screen flex-col bg-background text-foreground">
    <Header />
    <main className="flex-1">
      <div className="container mx-auto px-4 py-5"><Breadcrumbs items={[{ label: policy.title }]} /></div>
      <section className="container mx-auto px-4 pb-10" aria-labelledby="policy-title">
        <div className="rounded-2xl border bg-muted/25 p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Jacketee policies</p>
          <h1 id="policy-title" className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{policy.title}</h1>
          <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">{policy.description}</p>
          <p className="mt-5 text-sm text-muted-foreground">Last updated: <time dateTime="2026-10-27">October 27, 2026</time></p>
        </div>
      </section>
      <div className="container mx-auto grid items-start gap-6 px-4 pb-12 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10 md:pb-16">
        <nav aria-label={`${policy.title} contents`} className="rounded-xl border p-4 lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">On this page</p>
          <ol className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">{policy.sections.map((section, index) => <li key={section.id}><a href={`#${section.id}`} className="flex min-h-11 gap-2 rounded-md px-2 py-2 text-sm leading-6 hover:bg-muted"><span className="text-muted-foreground">{index + 1}.</span>{section.title}</a></li>)}</ol>
        </nav>
        <div className="min-w-0">
          <section aria-labelledby="policy-overview" className="mb-8 rounded-xl border bg-primary/5 p-5 sm:p-6">
            <h2 id="policy-overview" className="text-lg font-semibold">At a glance</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7">{policy.summary.map(item => <li key={item}>{item}</li>)}</ul>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">This overview is a guide. The full policy below explains the details.</p>
          </section>
          <div className="divide-y rounded-xl border bg-card px-5 sm:px-8">{policy.sections.map((section, index) => <section id={section.id} key={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-28 py-7 sm:py-8">
            <h2 id={`${section.id}-title`} className="text-xl font-semibold sm:text-2xl">{index + 1}. {section.title}</h2>
            <div className="mt-4 space-y-4 text-base leading-7 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:font-semibold [&_strong]:text-foreground">{section.content}</div>
          </section>)}</div>
          <div className="mt-8 rounded-xl border p-5 sm:p-6"><Mail className="h-5 w-5 text-primary" /><h2 className="mt-3 text-lg font-semibold">Questions about this policy?</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">Email <a href="mailto:info@jacketee.com" className="break-all text-primary underline underline-offset-4">info@jacketee.com</a> or <Link href="/contact" className="text-primary underline underline-offset-4">contact our team</Link>. Our published contact location is Adalatghar, Sialkot.</p></div>
          <nav aria-label="Related policies" className="mt-6 flex flex-wrap gap-3">{[['Privacy Policy', '/privacy-policy'], ['Terms of Service', '/terms-of-service'], ['Cookie Policy', '/cookie-policy']].filter(([, href]) => href !== policy.path).map(([title, href]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted">{title}<ArrowRight className="h-4 w-4" /></Link>)}</nav>
        </div>
      </div>
    </main>
    <Footer />
  </div>
}
