import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'
const PAGE_URL = `${SITE_URL}/login`

export const metadata: Metadata = {
  title: 'Sign In — LUXE STORE',
  description: 'Sign in to your LUXE STORE account to manage orders, wishlists, and personal details.',
  alternates: { canonical: PAGE_URL },
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Sign In — LUXE STORE',
    description: 'Sign in to your LUXE STORE account.',
    url: PAGE_URL,
    siteName: 'LUXE STORE',
    type: 'website',
  },
}
