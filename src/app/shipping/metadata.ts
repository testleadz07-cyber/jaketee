import { Metadata } from 'next'
import { shippingCoverageText, STANDARD_SHIPPING_USD } from '@/config/fulfillment'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const PAGE_URL = `${SITE_URL}/shipping`

export const metadata: Metadata = {
  title: 'Shipping Information — Jacketee',
  description: `${shippingCoverageText} One jacket ships for $${STANDARD_SHIPPING_USD} USD. Multiple jackets require a quote.`,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Shipping Information — Jacketee',
    description: `${shippingCoverageText} Jacketee shipping charges, multi-jacket quotes, and delivery timelines.`,
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Shipping Information — Jacketee',
    description: `${shippingCoverageText} Jacketee shipping charges and delivery timelines.`,
  },
}
