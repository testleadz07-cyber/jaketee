'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Sends a heartbeat to keep the LoginSession alive in the database.
 * Also fires a session-end call when the tab is closed or the user navigates away.
 */
export function useSessionTracker() {
  const { data: session, status } = useSession()
  const hasStarted = useRef(false)

  useEffect(() => {
    if (status !== 'authenticated' || !session) return

    const beat = () => {
      fetch('/api/sessions/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {})
    }

    if (!hasStarted.current) {
      hasStarted.current = true
      beat()
    }

    const interval = setInterval(beat, 60_000)

    const handleUnload = () => {
      navigator.sendBeacon?.('/api/sessions/end')
    }

    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [status, session])
}
