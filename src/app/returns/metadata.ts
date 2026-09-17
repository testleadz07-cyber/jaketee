import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'
const PAGE_URL = `${SITE_URL}/returns`

export const metadata: Metadata = {
  title: 'Returns & Exchanges — Jacketee',
  description: 'Eligible stock jackets may be returned within 10 days. Learn about Jacketee return eligibility, restocking fees and custom-item exceptions.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Returns & Exchanges — Jacketee',
    description: 'Learn about Jacketee 10-day stock-jacket returns, restocking fees and custom-item exceptions.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Returns & Exchanges — Jacketee',
    description: 'Jacketee 10-day stock-jacket returns and custom-item exceptions.',
  },
}
