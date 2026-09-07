import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'
const PAGE_URL = `${SITE_URL}/privacy-policy`

export const metadata: Metadata = {
  title: 'Privacy Policy — Jacketee',
  description: 'Read Jacketee\'s privacy policy to understand how we collect, use, and protect your personal information.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Privacy Policy — Jacketee',
    description: 'How Jacketee collects, uses, and protects your personal information.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
}
