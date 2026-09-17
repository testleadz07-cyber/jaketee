import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'
const PAGE_URL = `${SITE_URL}/shipping`

export const metadata: Metadata = {
  title: 'Shipping Information — Jacketee',
  description: 'One jacket ships for $30 USD. Shipping for multiple jackets is quoted by quantity and weight. Learn about Jacketee delivery timelines.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Shipping Information — Jacketee',
    description: 'Jacketee shipping charges, multi-jacket quotes, and delivery timelines.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Shipping Information — Jacketee',
    description: 'Jacketee shipping charges and delivery timelines.',
  },
}
