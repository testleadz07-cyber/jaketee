import { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jacketee.com'

export const metadata: Metadata = {
  title: 'Custom Varsity & Bomber Jackets | Jacketee',
  description:
    'Shop varsity, bomber, leather, puffer, and other jackets at Jacketee. Explore custom colors, patches, embroidery, and bulk order options.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Custom Varsity & Bomber Jackets | Jacketee',
    description:
      'Shop varsity, bomber, leather, puffer, and other jackets at Jacketee. Explore custom colors, patches, embroidery, and bulk order options.',
    url: SITE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom Varsity & Bomber Jackets | Jacketee',
    description:
      'Shop varsity, bomber, leather, puffer, and other jackets at Jacketee. Explore custom colors, patches, embroidery, and bulk order options.',
  },
}
