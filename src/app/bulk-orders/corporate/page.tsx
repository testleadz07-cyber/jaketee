export const dynamic = 'force-dynamic'

import { withSocialMetadata } from '@/lib/seo-metadata'
import type { Metadata } from 'next'
import { BulkProgramPage } from '@/components/bulk-program-page'

export const revalidate = 60

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const PAGE_URL = `${SITE_URL}/bulk-orders/corporate`

export const metadata: Metadata = withSocialMetadata({
  title: 'Custom Corporate Jackets with Company Logos | Jacketee',
  description:
    'Plan company jackets with logos for staff, events and gifting. Compare bomber, coach and varsity styles and request a bulk quote for 10 or more jackets.',
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
