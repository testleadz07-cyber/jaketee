import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'
const PAGE_URL = `${SITE_URL}/forgot-password`

export const metadata: Metadata = {
  title: 'Forgot Password — Jacketee',
  description: 'Reset your Jacketee account password. Enter your email address and we\'ll send you a reset link.',
  alternates: { canonical: PAGE_URL },
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Forgot Password — Jacketee',
    description: 'Reset your Jacketee account password.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
}
