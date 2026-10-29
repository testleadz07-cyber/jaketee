'use client'

import { apiFetch as fetch } from '@/lib/api-fetch'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Sends a heartbeat to keep the LoginSession alive in the database.
 * Also fires a session-end call when the tab is closed or the user navigates away.
 */
export function useSessionTracker() {
  const { data: session, status } = useSession()
  const inFlight = useRef(false)
  const sessionKey = String((session?.user as { loginSessionId?: string })?.loginSessionId || '')

  useEffect(() => {
    if (status !== 'authenticated' || !sessionKey) return

    let channel: BroadcastChannel | null = null
    try { if (typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel('jacketee-heartbeat') } catch { /* Per-tab tracking still works. */ }
    let expired = false
    let sharedLastBeat = 0
    if (channel) channel.onmessage = event => {
      if (event.data?.key === sessionKey && Number.isFinite(event.data?.time) && event.data.time <= Date.now()) sharedLastBeat = event.data.time
    }
    let lastBeat = 0
    let interval: ReturnType<typeof setInterval> | undefined
    const beat = async () => {
      if (expired || document.visibilityState !== 'visible' || inFlight.current) return
      if (Date.now() - Math.max(lastBeat, sharedLastBeat) < 60_000) return
      inFlight.current = true
      lastBeat = Date.now()
      try { channel?.postMessage({ key: sessionKey, time: lastBeat }) } catch { /* Optional deduplication. */ }
      try {
        const response = await fetch('/api/sessions/heartbeat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15_000) })
        if (response.status === 401) { expired = true; clearInterval(interval) }
      } catch { /* Analytics must not affect authentication. */ }
      finally { inFlight.current = false }
    }
    const visibility = () => {
      clearInterval(interval)
      if (expired || document.visibilityState !== 'visible') return
      void beat()
      interval = setInterval(() => { void beat() }, 60_000)
    }
    visibility()
    document.addEventListener('visibilitychange', visibility)

    const handleUnload = () => {
      navigator.sendBeacon?.('/api/sessions/end')
    }

    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearInterval(interval)
      channel?.close()
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [status, sessionKey])
}
