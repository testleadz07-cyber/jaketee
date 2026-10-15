'use client'

import { usePathname } from 'next/navigation'
import { useActivityView } from '@/hooks/use-activity-view'

export function GuestActivityTracker() {
  const pathname = usePathname()
  // Account and administration routes are outside storefront browsing analytics.
  const enabled = !/^\/(admin|profile|login|register|reset-password|forgot-password)(\/|$)/.test(pathname)
  useActivityView('page_view', {}, enabled)
  return null
}
