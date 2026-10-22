import { withSocialMetadata } from '@/lib/seo-metadata'
import type { Metadata } from 'next'
import { BulkProgramPage } from '@/components/bulk-program-page'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const PAGE_URL = `${SITE_URL}/bulk-orders/schools`

export const metadata: Metadata = withSocialMetadata({
  title: 'School Letterman Jackets & Team Orders | Jacketee',
  description:
    'Order school letterman jackets and team varsity jackets for clubs, seniors, alumni and achievement programs. Plan colors, patches, names and sizing.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'School Varsity Jacket Bulk Orders | Jacketee',
    description: 'Plan a school or team varsity jacket order with names, numbers, patches, colors, and size collection.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
  },
})

export default function Page() {
  return <BulkProgramPage kind="schools" />
}
