import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'
const PAGE_URL = `${SITE_URL}/register`

export const metadata: Metadata = {
  title: 'Create Account — Jacketee',
  description: 'Create a free Jacketee account to track orders, save your wishlist, and enjoy a faster checkout experience.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Create Account — Jacketee',
    description: 'Join Jacketee and enjoy faster checkout, order tracking, and exclusive member benefits.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Create Account — Jacketee',
    description: 'Join Jacketee for a better shopping experience.',
  },
}
