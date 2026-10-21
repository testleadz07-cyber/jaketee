import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HomeDesignCta() {
  return (
    <section className="store-section store-section--plain" aria-labelledby="home-design-cta-heading">
      <div className="section-shell py-8! md:py-10!">
        <div className="rounded-xl bg-zinc-950 px-5 py-8 text-center text-white sm:px-10 md:py-10">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-white/65">Make it yours with Jacketee</p>
            <h2 id="home-design-cta-heading" className="mt-2 text-3xl font-bold md:text-4xl">Ready to create your own jacket?</h2>
            <p className="mt-4 text-sm leading-7 text-white/75 md:text-base">
              Start with <Link href="/varsity-jackets" className="font-medium text-white underline underline-offset-4">varsity jackets</Link> or <Link href="/bomber-jackets" className="font-medium text-white underline underline-offset-4">bomber jackets</Link>, explore our <Link href="/materials-colors" className="font-medium text-white underline underline-offset-4">materials &amp; colors</Link>, and add names, letters, numbers, or logo artwork in the jacket designer. Find inspiration in our <Link href="/patches-embroidery" className="font-medium text-white underline underline-offset-4">patches &amp; embroidery guide</Link>.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary"><Link href="/varsity-jackets">Shop Varsity Jackets</Link></Button>
              <Button asChild size="lg" className="bg-red-700 text-white hover:bg-red-800"><Link href="/design">Design Your Jacket <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" /></Link></Button>
            </div>
            <p className="mt-5 text-sm leading-6 text-white/65">Ordering for a school, team, or brand? <Link href="/bulk-orders#bulk-quote" className="font-medium text-white underline underline-offset-4">Request a free bulk quote</Link>. Need design help? <Link href="/contact" className="font-medium text-white underline underline-offset-4">Contact our team</Link>.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
