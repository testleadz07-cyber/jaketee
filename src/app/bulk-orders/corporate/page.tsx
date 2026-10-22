import { withSocialMetadata } from '@/lib/seo-metadata'
import type { Metadata } from 'next'
import { BulkProgramPage } from '@/components/bulk-program-page'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const PAGE_URL = `${SITE_URL}/bulk-orders/corporate`

export const metadata: Metadata = withSocialMetadata({
  title: 'Corporate Varsity Jackets & Company Orders | Jacketee',
  description:
    'Order corporate varsity jackets and custom company jackets for uniforms, events and office teams. Plan logos, materials, sizing and delivery.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Corporate Custom Jacket Bulk Orders | Jacketee',
    description: 'Logo jackets and branded outerwear programs for companies, teams, offices, and events.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
})

export default function Page() {
  return <BulkProgramPage kind="corporate" />
}
