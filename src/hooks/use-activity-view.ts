'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { logUserActivity } from '@/lib/activity'
import { COOKIE_CONSENT_UPDATED_EVENT, COOKIE_CONSENT_KEY, getStoredConsent } from '@/lib/cookie-consent'

/** One view per mounted navigation/consent period, including delayed consent. */
export function useActivityView(action: 'page_view' | 'view_product' | 'view_category', details: Record<string, unknown>, enabled = true) {
  const pathname = usePathname()
  const serialized = JSON.stringify(details)
  const sent = useRef('')
  useEffect(() => {
    const key = `${pathname}:${action}:${serialized}`
    const record = () => {
      if (!enabled || !getStoredConsent()?.analytics) { sent.current = ''; return }
      if (sent.current === key) return
      sent.current = key
      void logUserActivity(action, JSON.parse(serialized)).then(ok => {
        if (!ok && sent.current === key) sent.current = ''
      })
    }
    const storage = (event: StorageEvent) => { if (event.key === COOKIE_CONSENT_KEY || event.key === null) record() }
    record()
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, record)
    window.addEventListener('storage', storage)
    return () => {
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, record)
      window.removeEventListener('storage', storage)
    }
  }, [action, pathname, serialized, enabled])
}
