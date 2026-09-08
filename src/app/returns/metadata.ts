import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'
const PAGE_URL = `${SITE_URL}/returns`

export const metadata: Metadata = {
  title: 'Returns & Exchanges — Jacketee',
  description: 'Jacketee\'s hassle-free 30-day return and exchange policy. Learn how to start a return, what items are eligible, and how long refunds take.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Returns & Exchanges — Jacketee',
    description: '30-day hassle-free returns and exchanges. Learn how to start a return at Jacketee.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Returns & Exchanges — Jacketee',
    description: '30-day hassle-free returns. Start a return at Jacketee.',
  },
}
