import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'
const PAGE_URL = `${SITE_URL}/blog`

export const metadata: Metadata = {
  title: 'Style Blog & Fashion Tips — Jacketee',
  description: 'Explore style guides, fashion tips, outfit ideas, and the latest trends from the Jacketee editorial team.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Style Blog & Fashion Tips — Jacketee',
    description: 'Explore style guides, fashion tips, outfit ideas, and the latest trends from Jacketee.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Style Blog & Fashion Tips — Jacketee',
    description: 'Explore style guides, fashion tips, and the latest trends from Jacketee.',
  },
}
