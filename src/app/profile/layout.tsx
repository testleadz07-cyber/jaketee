import { withSocialMetadata } from '@/lib/seo-metadata'
import { Metadata } from 'next'

export const metadata: Metadata = withSocialMetadata({
  robots: { index: false, follow: false },
})

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
