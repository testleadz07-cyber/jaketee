import { withSocialMetadata } from '@/lib/seo-metadata'
import { Metadata } from 'next'

export const metadata: Metadata = withSocialMetadata({
  title: 'Reset Password — Jacketee',
  description: 'Set a new password for your Jacketee account.',
  robots: { index: false, follow: false },
})
