'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { logUserActivity, type AnalyticsEventName } from '@/lib/activity'
import { getStoredConsent } from '@/lib/cookie-consent'

export function useCustomizationInsights(productId: string) {
  const [needsHelp, setNeedsHelp] = useState(false)
  const pendingExit = useRef<ReturnType<typeof setTimeout> | null>(null)
  const state = useRef({ sessionId: '', step: '', index: -1, seconds: 0, backtracks: 0, completed: false, exited: false, prompted: false, reasons: new Set<string>() })
  const track = useCallback((action: AnalyticsEventName, extra: Record<string, string | number> = {}) => {
    const current = state.current
    if (!current.sessionId) current.sessionId = crypto.randomUUID()
    void logUserActivity(action, { source: 'customize_page', productId, customizationSessionId: current.sessionId, step: current.step, activeSeconds: current.seconds, ...extra })
    if (getStoredConsent()?.analytics) window.gtag?.('event', action, { product_id: productId, step: current.step, ...extra })
  }, [productId])

  const difficulty = useCallback((reason: string) => {
    const current = state.current
    if (current.completed || current.reasons.has(reason)) return
    current.reasons.add(reason)
    track('customization_difficulty', { reason })
    if (!current.prompted) { current.prompted = true; setNeedsHelp(true) }
  }, [track])

  const stepChanged = useCallback((step: string, index: number) => {
    const current = state.current
    if (step === current.step && index === current.index) return
    if (current.index === -1) track('customization_started')
    else if (index > current.index) track('customization_step_completed')
    else if (++current.backtracks >= 3) difficulty('repeated_backtracking')
    current.step = step
    current.index = index
    current.seconds = 0
    track('customization_step_viewed', { stepIndex: index })
  }, [difficulty, track])

  useEffect(() => {
    if (pendingExit.current !== null) clearTimeout(pendingExit.current)
    const timer = window.setInterval(() => {
      const current = state.current
      if (document.visibilityState !== 'visible' || !document.hasFocus() || current.completed || current.index < 0) return
      if (++current.seconds === 120) difficulty('long_time_on_step')
    }, 1000)
    const exit = () => {
      const current = state.current
      if (current.completed || current.exited || current.index < 0 || !getStoredConsent()?.analytics) return
      current.exited = true
      void fetch('/api/activity', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', 'x-analytics-consent': 'granted' }, body: JSON.stringify({ action: 'customization_abandoned', details: { source: 'customize_page', productId, customizationSessionId: current.sessionId, step: current.step, activeSeconds: current.seconds } }) }).catch(() => {})
    }
    const restore = () => { state.current.exited = false }
    window.addEventListener('pagehide', exit)
    window.addEventListener('pageshow', restore)
    return () => {
      clearInterval(timer)
      window.removeEventListener('pagehide', exit)
      window.removeEventListener('pageshow', restore)
      // Defer unmount reporting so Strict Mode's effect replay does not report an exit.
      pendingExit.current = setTimeout(exit, 0)
    }
  }, [difficulty, productId])

  const complete = useCallback((method: string) => {
    state.current.completed = true
    setNeedsHelp(false)
    track('customization_completed', { method })
  }, [track])
  const requestHelp = () => {
    track('customization_help_requested')
    setNeedsHelp(false)
    window.dispatchEvent(new CustomEvent('customization-support-request', { detail: { productId, step: state.current.step } }))
  }
  const dismissHelp = () => { setNeedsHelp(false); track('customization_help_dismissed') }
  return { needsHelp, stepChanged, difficulty, complete, requestHelp, dismissHelp }
}
