import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'
const PAGE_URL = `${SITE_URL}/register`

export const metadata: Metadata = {
  title: 'Create Account — LUXE STORE',
  description: 'Create a free LUXE STORE account to track orders, save your wishlist, and enjoy a faster checkout experience.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Create Account — LUXE STORE',
    description: 'Join LUXE STORE and enjoy faster checkout, order tracking, and exclusive member benefits.',
    url: PAGE_URL,
    siteName: 'LUXE STORE',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Create Account — LUXE STORE',
    description: 'Join LUXE STORE for a better shopping experience.',
  },
}
