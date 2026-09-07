import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'
const PAGE_URL = `${SITE_URL}/cookie-policy`

export const metadata: Metadata = {
  title: 'Cookie Policy — Jacketee',
  description: 'Learn how Jacketee uses cookies and similar technologies, and how you can manage your preferences.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Cookie Policy — Jacketee',
    description: 'How Jacketee uses cookies and how to manage your preferences.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
}
