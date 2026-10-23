import { withSocialMetadata } from '@/lib/seo-metadata'
import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const PAGE_URL = `${SITE_URL}/faq`

export const metadata: Metadata = withSocialMetadata({
  title: 'Frequently Asked Questions — Jacketee',
  description: 'Search Jacketee FAQs about custom jacket design, sizing, production, shipping, returns, payments and bulk team orders. Browse answers by topic or contact the team.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'FAQ — Jacketee',
    description: 'Find help with jacket customization, sizing, order tracking, production, shipping, returns and bulk team orders.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'FAQ — Jacketee',
    description: 'Search answers about custom jackets, sizing, shipping, returns and bulk orders.',
  },
})
