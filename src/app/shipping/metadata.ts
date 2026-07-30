import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'
const PAGE_URL = `${SITE_URL}/shipping`

export const metadata: Metadata = {
  title: 'Shipping Information — LUXE STORE',
  description: 'Learn about LUXE STORE\'s shipping options, delivery times, rates, and free shipping eligibility. Free shipping on orders over $75.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Shipping Information — LUXE STORE',
    description: 'Shipping options, delivery times, and free shipping details for LUXE STORE orders.',
    url: PAGE_URL,
    siteName: 'LUXE STORE',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Shipping Information — LUXE STORE',
    description: 'Shipping options and delivery times for LUXE STORE orders.',
  },
}
