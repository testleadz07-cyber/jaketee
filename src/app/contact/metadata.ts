import { withSocialMetadata } from '@/lib/seo-metadata'
import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const PAGE_URL = `${SITE_URL}/contact`

export const metadata: Metadata = withSocialMetadata({
  title: 'Contact Us — Jacketee',
  description: 'Contact Jacketee for custom jacket design help, order support, sizing and shipping questions. Reach us by email, phone, WhatsApp or our contact form.',
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
    description: 'Get custom jacket design help and order support by email, phone, WhatsApp or our contact form.',
  },
})
