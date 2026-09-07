import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'
const PAGE_URL = `${SITE_URL}/track-order`

export const metadata: Metadata = {
  title: 'Track Your Order — Jacketee',
  description: 'Enter your order number and email to get real-time shipping status and estimated delivery for your Jacketee order.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Track Your Order — Jacketee',
    description: 'Get real-time shipping status for your Jacketee order.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Track Your Order — Jacketee',
    description: 'Real-time order tracking for Jacketee purchases.',
  },
}
