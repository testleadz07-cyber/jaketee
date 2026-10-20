import { withSocialMetadata } from '@/lib/seo-metadata'
import { Metadata } from 'next'
import { shippingCoverageText, STANDARD_SHIPPING_USD } from '@/config/fulfillment'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const PAGE_URL = `${SITE_URL}/shipping`

export const metadata: Metadata = withSocialMetadata({
  title: 'Shipping Information — Jacketee',
  description: `${shippingCoverageText} One jacket ships for $${STANDARD_SHIPPING_USD} USD. Each additional jacket ships for $20 USD.`,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Shipping Information — Jacketee',
    description: `${shippingCoverageText} Jacketee shipping charges, additional-jacket rates, and delivery timelines.`,
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Shipping Information — Jacketee',
    description: `${shippingCoverageText} Jacketee shipping charges and delivery timelines.`,
  },
})
