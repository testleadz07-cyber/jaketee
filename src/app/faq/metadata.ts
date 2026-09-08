import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'
const PAGE_URL = `${SITE_URL}/faq`

export const metadata: Metadata = {
  title: 'Frequently Asked Questions — Jacketee',
  description: 'Find answers to common questions about shipping, returns, payments, order tracking, and more at Jacketee.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'FAQ — Jacketee',
    description: 'Answers to the most common questions about orders, shipping, returns, and payments at Jacketee.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'FAQ — Jacketee',
    description: 'Common questions about shipping, returns, payments, and orders at Jacketee.',
  },
}
