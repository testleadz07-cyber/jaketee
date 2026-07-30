import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'
const PAGE_URL = `${SITE_URL}/blog`

export const metadata: Metadata = {
  title: 'Style Blog & Fashion Tips — LUXE STORE',
  description: 'Explore style guides, fashion tips, outfit ideas, and the latest trends from the LUXE STORE editorial team.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Style Blog & Fashion Tips — LUXE STORE',
    description: 'Explore style guides, fashion tips, outfit ideas, and the latest trends from LUXE STORE.',
    url: PAGE_URL,
    siteName: 'LUXE STORE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Style Blog & Fashion Tips — LUXE STORE',
    description: 'Explore style guides, fashion tips, and the latest trends from LUXE STORE.',
  },
}
