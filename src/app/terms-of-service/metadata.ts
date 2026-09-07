import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'
const PAGE_URL = `${SITE_URL}/terms-of-service`

export const metadata: Metadata = {
  title: 'Terms of Service — Jacketee',
  description: 'Read Jacketee\'s terms of service governing use of our website, purchasing products, and our warranties.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Terms of Service — Jacketee',
    description: 'Terms governing use of the Jacketee website and purchase of products.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
}
