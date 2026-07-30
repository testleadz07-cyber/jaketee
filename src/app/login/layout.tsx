// Server component — applies this route's metadata (title/canonical/OG/Twitter,
// including noindex), since the 'use client' page.tsx can't export metadata itself.

export { metadata } from './metadata'

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
