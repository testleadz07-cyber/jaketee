// Server component — applies this route's metadata (title/canonical/OG/Twitter,
// including noindex), since the 'use client' page.tsx can't export metadata itself.

export { metadata } from './metadata'
import { connection } from 'next/server'
import { GoogleAuthAvailabilityProvider } from '@/components/google-auth-availability'

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  await connection()
  return <GoogleAuthAvailabilityProvider enabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}>{children}</GoogleAuthAvailabilityProvider>
}
