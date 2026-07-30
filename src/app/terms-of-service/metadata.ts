import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'
const PAGE_URL = `${SITE_URL}/terms-of-service`

export const metadata: Metadata = {
  title: 'Terms of Service — LUXE STORE',
  description: 'Read LUXE STORE\'s terms of service governing use of our website, purchasing products, and our warranties.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Terms of Service — LUXE STORE',
    description: 'Terms governing use of the LUXE STORE website and purchase of products.',
    url: PAGE_URL,
    siteName: 'LUXE STORE',
    type: 'website',
  },
}
