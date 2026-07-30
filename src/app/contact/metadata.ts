import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'
const PAGE_URL = `${SITE_URL}/contact`

export const metadata: Metadata = {
  title: 'Contact Us — LUXE STORE',
  description: 'Get in touch with the LUXE STORE team. We\'re available Mon–Fri 9am–6pm EST and typically respond within 24 hours.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Contact Us — LUXE STORE',
    description: 'Questions about your order or our products? Reach out to the LUXE STORE support team.',
    url: PAGE_URL,
    siteName: 'LUXE STORE',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Contact Us — LUXE STORE',
    description: 'Reach out to LUXE STORE support. We respond within 24 hours.',
  },
}
