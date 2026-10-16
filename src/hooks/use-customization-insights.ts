'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { logUserActivity, type AnalyticsEventName } from '@/lib/activity'
import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_UPDATED_EVENT, getStoredConsent } from '@/lib/cookie-consent'

const newSession = () => ({ sessionId: '', started: false, step: '', index: -1, seconds: 0, backtracks: 0, completed: false, exited: false, prompted: false, reasons: new Set<string>() })

export function useCustomizationInsights(productId: string) {
  const [needsHelp, setNeedsHelp] = useState(false)
  const pendingExits = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const sessions = useRef(new Map<string, ReturnType<typeof newSession>>())
  const getCurrent = useCallback(() => {
    let current = sessions.current.get(productId)
    if (!current) { current = newSession(); sessions.current.set(productId, current) }
    return current
  }, [productId])
  const track = useCallback((action: AnalyticsEventName, extra: Record<string, string | number> = {}) => {
    if (!getStoredConsent()?.analytics) return
    const current = getCurrent()
    const emit = (event: AnalyticsEventName, values: Record<string, string | number> = {}) => {
      void logUserActivity(event, { source: 'customize_page', productId, customizationSessionId: current.sessionId, step: current.step, activeSeconds: current.seconds, ...values })
      window.gtag?.('event', event, { product_id: productId, step: current.step, ...values })
    }
    if (!current.started) {
      current.sessionId = crypto.randomUUID()
      current.started = true
      emit('customization_started')
      if (action !== 'customization_step_viewed' && current.index >= 0) emit('customization_step_viewed', { stepIndex: current.index })
    }
    if (action !== 'customization_started') emit(action, extra)
  }, [getCurrent, productId])

  const difficulty = useCallback((reason: string) => {
    const current = getCurrent()
    if (current.completed || current.reasons.has(reason)) return
    current.reasons.add(reason)
    track('customization_difficulty', { reason })
    if (!current.prompted) { current.prompted = true; setNeedsHelp(true) }
  }, [getCurrent, track])

  const stepChanged = useCallback((step: string, index: number) => {
    const current = getCurrent()
    if (current.completed || (step === current.step && index === current.index)) return
    if (current.index === -1) setNeedsHelp(false)
    else if (index > current.index) track('customization_step_completed')
    else if (++current.backtracks >= 3) difficulty('repeated_backtracking')
    current.step = step
    current.index = index
    current.seconds = 0
    track('customization_step_viewed', { stepIndex: index })
  }, [difficulty, getCurrent, track])

  useEffect(() => {
    const pending = pendingExits.current
    const previousExit = pending.get(productId)
    if (previousExit !== undefined) clearTimeout(previousExit)
    const current = getCurrent()
    const timer = window.setInterval(() => {
      if (!getStoredConsent()?.analytics || document.visibilityState !== 'visible' || !document.hasFocus() || current.completed || current.index < 0) return
      if (++current.seconds === 120) difficulty('long_time_on_step')
    }, 1000)
    const exit = () => {
      if (current.completed || current.exited || !current.started || current.index < 0 || !getStoredConsent()?.analytics) return
      current.exited = true
      void logUserActivity('customization_abandoned', { source: 'customize_page', productId, customizationSessionId: current.sessionId, step: current.step, activeSeconds: current.seconds })
    }
    const consentChanged = () => {
      if (!getStoredConsent()?.analytics) {
        current.started = false
        current.sessionId = ''
        current.seconds = 0
        current.reasons.clear()
        return
      }
      if (!current.completed && current.index >= 0 && !current.started) track('customization_step_viewed', { stepIndex: current.index })
    }
    const storageChanged = (event: StorageEvent) => { if (event.key === COOKIE_CONSENT_KEY || event.key === null) consentChanged() }
    const restore = () => {
      if (current.exited) { current.started = false; current.sessionId = ''; current.seconds = 0 }
      current.exited = false
      consentChanged()
    }
    window.addEventListener('pagehide', exit)
    window.addEventListener('pageshow', restore)
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, consentChanged)
    window.addEventListener('storage', storageChanged)
    return () => {
      clearInterval(timer)
      window.removeEventListener('pagehide', exit)
      window.removeEventListener('pageshow', restore)
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, consentChanged)
      window.removeEventListener('storage', storageChanged)
      // Defer reporting so Strict Mode effect replay can cancel a synthetic exit.
      pending.set(productId, setTimeout(exit, 0))
    }
  }, [difficulty, getCurrent, productId, track])

  const complete = useCallback((method: string) => {
    const current = getCurrent()
    if (current.completed) return
    current.completed = true
    setNeedsHelp(false)
    track('customization_completed', { method })
  }, [getCurrent, track])
  const dismissHelp = () => { setNeedsHelp(false); track('customization_help_dismissed') }
  return { needsHelp, stepChanged, difficulty, complete, dismissHelp }
}
