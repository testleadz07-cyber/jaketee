import { withSocialMetadata } from '@/lib/seo-metadata'
import type { Metadata } from 'next'
import { BulkProgramPage } from '@/components/bulk-program-page'

export const revalidate = 60

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const PAGE_URL = `${SITE_URL}/bulk-orders/schools`

export const metadata: Metadata = withSocialMetadata({
  title: 'Bulk Varsity & School Letterman Jackets | Jacketee',
  description:
    'Plan bulk varsity and wholesale letterman jackets for schools and teams. Organize school colors, award patches, names and sizes. Request a quote for 10+.',
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
