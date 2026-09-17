import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { PolicyResources } from '@/components/policy-resources'

export const dynamic = 'force-dynamic'

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-10">
        <Breadcrumbs items={[{ label: 'Shipping' }]} className="mb-8" />
        <h1 className="text-3xl font-bold md:text-4xl">Shipping & Delivery</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Shipping charges and delivery estimates depend on the size of your order.</p>

        <section className="mt-10 border-t py-8" aria-labelledby="shipping-rates">
          <h2 id="shipping-rates" className="text-2xl font-semibold">Shipping charges</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div className="border-l-2 border-foreground pl-5">
              <h3 className="font-semibold">One jacket</h3>
              <p className="mt-1 text-muted-foreground">$30 USD shipping.</p>
            </div>
            <div className="border-l-2 border-foreground pl-5">
              <h3 className="font-semibold">Two or more jackets</h3>
              <p className="mt-1 text-muted-foreground">Shipping is quoted based on quantity and total package weight. Contact us for a quote before placing your order.</p>
            </div>
          </div>
        </section>

        <section className="border-t py-8" aria-labelledby="shipping-timing">
          <h2 id="shipping-timing" className="text-2xl font-semibold">Production & delivery</h2>
          <p className="mt-4 max-w-3xl text-muted-foreground">Bulk orders of 10 or more jackets typically take 3-4 weeks in total, including production and delivery. We confirm the schedule before production begins. For individual orders, ask our team for the current production and delivery estimate.</p>
          <p className="mt-4 text-muted-foreground">Tracking details are sent when your order ships. Delivery times can vary by destination and customs processing.</p>
        </section>

        <section className="border-t py-8" aria-labelledby="shipping-help">
          <h2 id="shipping-help" className="text-2xl font-semibold">Need a shipping quote?</h2>
          <p className="mt-3 text-muted-foreground">Tell us the jacket quantity, sizes and destination so we can confirm your shipping charge and timeline.</p>
          <Link href="/contact" className="mt-5 inline-flex h-10 items-center bg-foreground px-5 text-sm font-medium text-background hover:opacity-90">Contact Jacketee</Link>
        </section>
      </main>
      <PolicyResources topic="shipping" />
      <Footer />
    </div>
  )
}
