import { withSocialMetadata } from '@/lib/seo-metadata'
import type { Metadata } from 'next'
import { BulkProgramPage } from '@/components/bulk-program-page'

export const revalidate = 60

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const PAGE_URL = `${SITE_URL}/bulk-orders`

export const metadata: Metadata = withSocialMetadata({
  title: 'Bulk Varsity Jackets & Wholesale Orders | Jacketee',
  description:
    'Order bulk varsity jackets for schools, teams, companies and private labels. Get a free bulk quote for your artwork, sizing, materials and delivery needs.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Bulk Custom Jacket Orders | Jacketee',
    description: 'Bulk custom jacket programs for schools, companies, teams, and private label brands.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
})

export default function Page() {
  return <BulkProgramPage kind="all" />
}
