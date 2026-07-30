import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'
const PAGE_URL = `${SITE_URL}/faq`

export const metadata: Metadata = {
  title: 'Frequently Asked Questions — LUXE STORE',
  description: 'Find answers to common questions about shipping, returns, payments, order tracking, and more at LUXE STORE.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'FAQ — LUXE STORE',
    description: 'Answers to the most common questions about orders, shipping, returns, and payments at LUXE STORE.',
    url: PAGE_URL,
    siteName: 'LUXE STORE',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'FAQ — LUXE STORE',
    description: 'Common questions about shipping, returns, payments, and orders at LUXE STORE.',
  },
}
