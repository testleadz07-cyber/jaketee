import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'
const PAGE_URL = `${SITE_URL}/track-order`

export const metadata: Metadata = {
  title: 'Track Your Order — LUXE STORE',
  description: 'Enter your order number and email to get real-time shipping status and estimated delivery for your LUXE STORE order.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Track Your Order — LUXE STORE',
    description: 'Get real-time shipping status for your LUXE STORE order.',
    url: PAGE_URL,
    siteName: 'LUXE STORE',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Track Your Order — LUXE STORE',
    description: 'Real-time order tracking for LUXE STORE purchases.',
  },
}
