import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'
const PAGE_URL = `${SITE_URL}/contact`

export const metadata: Metadata = {
  title: 'Contact Us — Jacketee',
  description: 'Get in touch with the Jacketee team. We\'re available Mon–Fri 9am–6pm EST and typically respond within 24 hours.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Contact Us — Jacketee',
    description: 'Questions about your order or our products? Reach out to the Jacketee support team.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Contact Us — Jacketee',
    description: 'Reach out to Jacketee support. We respond within 24 hours.',
  },
}
