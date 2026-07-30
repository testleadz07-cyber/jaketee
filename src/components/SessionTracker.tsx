'use client'

import { useSessionTracker } from '@/hooks/useSessionTracker'

/**
 * Invisible component — mounts the session heartbeat tracker globally.
 * Must be placed inside a SessionProvider.
 */
export function SessionTracker() {
  useSessionTracker()
  return null
}
