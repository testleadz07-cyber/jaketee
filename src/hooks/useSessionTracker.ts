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
  const countryRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (status !== 'authenticated' || !session) return

    const beat = () => {
      const body: Record<string, any> = {}
      if (countryRef.current) body.country = countryRef.current
      fetch('/api/sessions/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => {})
    }

    // Resolve country once via ipapi (free, no key required)
    if (!hasStarted.current) {
      hasStarted.current = true
      fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) })
        .then((r) => r.json())
        .then((d) => {
          if (d?.country_name) countryRef.current = d.country_name
        })
        .catch(() => {})
      // First beat immediately
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
