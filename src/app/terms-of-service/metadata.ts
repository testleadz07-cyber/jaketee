import { withSocialMetadata } from '@/lib/seo-metadata'
import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const PAGE_URL = `${SITE_URL}/terms-of-service`

export const metadata: Metadata = withSocialMetadata({
  title: 'Terms of Service — Jacketee',
  description: 'Read Jacketee’s terms for orders, custom design approval, customer artwork, delivery, cancellations and consumer rights.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Terms of Service — Jacketee',
    description: 'Terms governing use of the Jacketee website and purchase of products.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
})
