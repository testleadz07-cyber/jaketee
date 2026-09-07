import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'
const PAGE_URL = `${SITE_URL}/shipping`

export const metadata: Metadata = {
  title: 'Shipping Information — Jacketee',
  description: 'Learn about Jacketee\'s shipping options, delivery times, rates, and free shipping eligibility. Free shipping on orders over $75.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Shipping Information — Jacketee',
    description: 'Shipping options, delivery times, and free shipping details for Jacketee orders.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Shipping Information — Jacketee',
    description: 'Shipping options and delivery times for Jacketee orders.',
  },
}
