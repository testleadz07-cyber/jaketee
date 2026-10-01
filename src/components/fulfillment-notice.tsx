import Link from 'next/link'
import { Clock3, Truck } from 'lucide-react'
import { fulfillmentConfig } from '@/config/fulfillment'

export function FulfillmentNotice({ bulk = false, compact = false }: { bulk?: boolean; compact?: boolean }) {
  return (
    <section className={compact ? 'space-y-2 text-xs text-muted-foreground' : 'border-y bg-muted/25'} aria-label="Production and delivery estimates">
      <div className={compact ? 'space-y-2' : 'container mx-auto grid gap-6 px-4 py-8 md:grid-cols-2'}>
        <div className="flex items-start gap-3">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div><strong className="block text-foreground">Production estimate</strong><span>{bulk ? fulfillmentConfig.bulkProductionDelivery : fulfillmentConfig.individualProduction}</span></div>
        </div>
        <div className="flex items-start gap-3">
          <Truck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div><strong className="block text-foreground">Shipping and delivery</strong><span>{fulfillmentConfig.singleJacketShipping} {fulfillmentConfig.multipleJacketShipping} {fulfillmentConfig.internationalShipping}</span> <Link href="/shipping" className="font-medium text-foreground underline underline-offset-4">Details</Link></div>
        </div>
      </div>
    </section>
  )
}
