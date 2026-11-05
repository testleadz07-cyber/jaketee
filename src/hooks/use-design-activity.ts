'use client'

import { useCallback, useEffect, useRef } from 'react'
import { customizationChanges, type CustomizationChange } from '@/lib/customization-changes'
import { getStoredConsent, COOKIE_CONSENT_UPDATED_EVENT } from '@/lib/cookie-consent'
import type { JacketCustomization } from '@/types/jacket-customization'

export function useDesignActivity(emit: (change: CustomizationChange) => void) {
  const emitRef = useRef(emit)
  emitRef.current = emit
  const pending = useRef<{ before: JacketCustomization; after: JacketCustomization } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const interacting = useRef(false)
  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    const batch = pending.current
    pending.current = null
    if (batch && getStoredConsent()?.analytics) customizationChanges(batch.before, batch.after).forEach(change => emitRef.current(change))
  }, [])
  const record = useCallback((before: JacketCustomization, after: JacketCustomization) => {
    if (!getStoredConsent()?.analytics) { pending.current = null; return }
    const changes = customizationChanges(before, after)
    if (!changes.length) return
    // Preserve apply/remove operations even when they happen quickly.
    if (changes.some(change => change.changeType !== 'changed')) {
      flush()
      changes.forEach(change => emitRef.current(change))
      return
    }
    pending.current = { before: pending.current?.before || before, after }
    if (timer.current) clearTimeout(timer.current)
    if (!interacting.current) timer.current = setTimeout(flush, 700)
  }, [flush])
  useEffect(() => {
    const consentChanged = () => { if (!getStoredConsent()?.analytics) { pending.current = null; if (timer.current) clearTimeout(timer.current) } }
    const hidden = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('pagehide', flush)
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, consentChanged)
    document.addEventListener('visibilitychange', hidden)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, consentChanged)
      document.removeEventListener('visibilitychange', hidden)
      flush()
    }
  }, [flush])
  const begin = () => { interacting.current = true; if (timer.current) clearTimeout(timer.current) }
  const end = () => { interacting.current = false; flush() }
  return { record, flush, begin, end }
}
