// Server component — applies this route's metadata (title/canonical/OG/Twitter),
// since the 'use client' page.tsx can't export metadata itself.

export { metadata } from './metadata'
import { connection } from 'next/server'
import { GoogleAuthAvailabilityProvider } from '@/components/google-auth-availability'

export default async function RegisterLayout({ children }: { children: React.ReactNode }) {
  await connection()
  return <GoogleAuthAvailabilityProvider enabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}>{children}</GoogleAuthAvailabilityProvider>
}
