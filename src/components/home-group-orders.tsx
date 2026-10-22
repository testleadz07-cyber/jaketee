import Link from 'next/link'
import { ArrowRight, GraduationCap, Building2, Tags, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const programs = [
  { title: 'Schools & teams', description: 'Class pride, club colors, and player names.', href: '/bulk-orders/schools', icon: GraduationCap },
  { title: 'Corporate apparel', description: 'Your brand, from the office to the next event.', href: '/bulk-orders/corporate', icon: Building2 },
  { title: 'Private label', description: 'Your collection, with your labels and details.', href: '/bulk-orders/private-label', icon: Tags },
]

export function HomeGroupOrders() {
  return (
    <section className="store-section bg-[#eee8df]" aria-labelledby="bulk-orders-heading">
      <div className="section-shell">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Made for your group</p>
          <h2 id="bulk-orders-heading" className="mt-3 text-3xl font-bold leading-tight tracking-tight md:text-4xl">One team. One look.<br />Made for all of you.</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">Custom jackets for schools, teams &amp; brands. Bring your colors and artwork; we?ll help bring the whole order together.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
          <div className="flex flex-col justify-between rounded-2xl bg-[#242b30] p-6 text-white sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Your group, your details</p>
              <h3 className="mt-3 text-2xl font-semibold">Matching jackets.<br />Individual stories.</h3>
              <ul className="mt-6 space-y-3 text-sm text-white/85">{['Coordinated colors and logo artwork', 'Individual names, numbers, and sizes', 'A digital proof to review before production'].map(item => <li key={item} className="flex gap-3"><Check aria-hidden="true" className="h-5 w-5 shrink-0 text-[#e6b8ad]" />{item}</li>)}</ul>
            </div>
            <div className="mt-8 border-t border-white/15 pt-6">
              <Button asChild size="lg" className="min-h-12 w-full bg-white text-zinc-950 hover:bg-zinc-100 sm:w-auto"><Link href="/bulk-orders">Explore Bulk &amp; Teams <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" /></Link></Button>
              <p className="mt-3 text-xs leading-5 text-white/65">Share your quantity, artwork, and required date.</p>
            </div>
          </div>
          <nav aria-label="Bulk jacket programs" className="grid gap-3">
            {programs.map(({ icon: Icon, ...item }) => <Link key={item.href} href={item.href} className="group flex min-h-28 items-center gap-4 rounded-xl border border-black/10 bg-white p-5 transition-colors hover:border-red-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f5f0ea]"><Icon aria-hidden="true" className="h-6 w-6 text-[#6e3430]" /></span><span className="min-w-0 flex-1"><span className="block text-base font-semibold">{item.title}</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">{item.description}</span></span><ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" /></Link>)}
          </nav>
        </div>
        <div className="mt-7 flex flex-col gap-4 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <ol className="flex flex-wrap gap-x-5 gap-y-3 text-sm">{['Share your brief', 'Review your quote', 'Approve your proof'].map((step, i) => <li key={step}><span className="mr-2 font-semibold text-primary">0{i + 1}</span>{step}</li>)}</ol>
          <Link href="/bulk-orders" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4">How group orders work <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  )
}
