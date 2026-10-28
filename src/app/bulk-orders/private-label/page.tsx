import { withSocialMetadata } from '@/lib/seo-metadata'
import type { Metadata } from 'next'
import { BulkProgramPage } from '@/components/bulk-program-page'

export const revalidate = 60

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const PAGE_URL = `${SITE_URL}/bulk-orders/private-label`

export const metadata: Metadata = withSocialMetadata({
  title: 'Private Label Custom Jackets | Jacketee',
  description:
    'Private label custom jacket programs for brands, merch lines, boutiques, and resellers. Plan samples, labels, trims, packaging, specs, and repeat orders.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Private Label Custom Jackets | Jacketee',
    description: 'Private label jacket programs with brand labels, custom specs, packaging direction, and repeat-order planning.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
})

export default function Page() {
  return <BulkProgramPage kind="private-label" />
}
