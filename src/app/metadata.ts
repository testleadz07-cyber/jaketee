import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxestore.com'

export const metadata: Metadata = {
  title: 'Jacketee — Premium Fashion & Activewear',
  description:
    'Shop premium fashion, activewear, and outdoor apparel. Varsity jackets, bomber jackets, tracksuits & more. Free shipping on orders over $75.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Jacketee — Premium Fashion & Activewear',
    description:
      'Shop premium fashion, activewear, and outdoor apparel. Varsity jackets, bomber jackets, tracksuits & more.',
    url: SITE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jacketee — Premium Fashion & Activewear',
    description:
      'Shop premium fashion, activewear, and outdoor apparel. Varsity jackets, bomber jackets, tracksuits & more.',
  },
}
