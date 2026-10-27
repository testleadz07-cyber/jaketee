'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useSession } from 'next-auth/react'
import { COOKIE_CONSENT_UPDATED_EVENT, COOKIE_CONSENT_KEY, getStoredConsent, openCookiePreferences } from '@/lib/cookie-consent'
import { enqueueActivityRequest } from '@/lib/activity-transport'
import { GUEST_FORM_FIELDS, sanitizeGuestForm, type GuestFormName } from '@/lib/guest-form-schema'

export function readGuestFormFields(form: GuestFormName, element: HTMLFormElement) {
  const data = new FormData(element)
  return Object.fromEntries(Object.keys(GUEST_FORM_FIELDS[form]).map(key => [key, typeof data.get(key) === 'string' ? data.get(key) : '']))
}

function subscribe(callback: () => void) {
  const storage = (event: StorageEvent) => { if (event.key === COOKIE_CONSENT_KEY || event.key === null) callback() }
  window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, callback)
  window.addEventListener('storage', storage)
  return () => { window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, callback); window.removeEventListener('storage', storage) }
}
function consentSnapshot() {
  const consent = getStoredConsent()
  return consent?.analytics && consent.formActivityVersion === 1 ? consent.updatedAt : ''
}

/** Guest-only, opt-in, debounced snapshots of explicitly allowed fields. */
export function useGuestFormActivity(form: GuestFormName, values: Record<string, unknown>) {
  const { status } = useSession()
  const consent = useSyncExternalStore(subscribe, consentSnapshot, () => '')
  const enabled = status === 'unauthenticated' && Boolean(consent)
  const snapshot = sanitizeGuestForm(form, values)
  const serialized = JSON.stringify(snapshot)
  const latest = useRef({ enabled, consent, snapshot })
  const [touchedConsent, setTouchedConsent] = useState('')
  const touchedRef = useRef('')
  const sessionId = useRef<string | null>(null)
  const revision = useRef(0)
  const submissionClosed = useRef(false)
  const lastSaved = useRef('')
  const submittedSnapshot = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { latest.current = { enabled, consent, snapshot } }, [enabled, consent, serialized])

  const save = useCallback((submitted = false, submittedValues?: Record<string, unknown>) => {
    const current = submittedValues ? { ...latest.current, snapshot: sanitizeGuestForm(latest.current.snapshot.form, submittedValues) } : latest.current
    if (!submitted && submissionClosed.current) return Promise.resolve(false)
    if (!current.enabled || !current.consent || current.consent !== consentSnapshot()) return Promise.resolve(false)
    if (!Object.keys(current.snapshot.fields).length && (submitted || !sessionId.current)) return Promise.resolve(false)
    const bodyKey = JSON.stringify(current.snapshot)
    if (!submitted && (lastSaved.current === bodyKey || submittedSnapshot.current === bodyKey)) return Promise.resolve(false)
    if (!sessionId.current) sessionId.current = crypto.randomUUID()
    const id = sessionId.current
    const expectedConsent = current.consent
    const payload = JSON.stringify({
      action: submitted ? 'guest_form_submitted' : 'guest_form_draft',
      details: { ...current.snapshot, formSessionId: id, formRevision: ++revision.current, consentAt: current.consent, path: window.location.pathname },
    })
    lastSaved.current = bodyKey
    if (submitted) {
      submissionClosed.current = true
      submittedSnapshot.current = bodyKey
      sessionId.current = null
      if (timer.current) clearTimeout(timer.current)
    }
    return enqueueActivityRequest(async () => {
      // Reject stale jobs after withdrawal, changed consent or sign-in.
      if (consentSnapshot() !== expectedConsent || !latest.current.enabled) return false
      try {
        const response = await fetch('/api/activity', {
          method: 'POST', keepalive: true, signal: AbortSignal.timeout(5000),
          headers: { 'Content-Type': 'application/json', 'x-analytics-consent': 'granted', 'x-form-analytics-consent': 'v1' },
          body: payload,
        })
        if (!response.ok && lastSaved.current === bodyKey) lastSaved.current = ''
        return response.ok
      } catch {
        if (lastSaved.current === bodyKey) lastSaved.current = ''
        return false // Optional activity must never break a submission.
      }
    })
  }, [])

  useEffect(() => {
    if (!enabled || touchedConsent !== consent) return
    timer.current = setTimeout(() => { void save() }, 1500)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [serialized, enabled, touchedConsent, consent, save])

  const touched = () => {
    if (!enabled) return
    if (submissionClosed.current) {
      submissionClosed.current = false; lastSaved.current = ''; submittedSnapshot.current = ''
    }
    touchedRef.current = consent; setTouchedConsent(consent)
  }
  const flush = useCallback(() => {
    if (latest.current.enabled && touchedRef.current === latest.current.consent) void save()
  }, [save])
  useEffect(() => {
    const leave = () => { if (document.visibilityState === 'hidden') flush() }
    document.addEventListener('visibilitychange', leave)
    window.addEventListener('pagehide', flush)
    return () => { document.removeEventListener('visibilitychange', leave); window.removeEventListener('pagehide', flush) }
  }, [flush])
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
    if (latest.current.enabled && touchedRef.current === latest.current.consent) void save()
  }, [save])

  return {
    bindings: { onInputCapture: touched, onChangeCapture: touched, onBlurCapture: flush, onSubmitCapture: () => { touched(); void save() } },
    // Give keepalive telemetry a bounded opportunity to start; never hold up a form/redirect.
    submitted: (submittedValues?: Record<string, unknown>) => Promise.race([save(true, submittedValues), new Promise<boolean>(resolve => setTimeout(() => resolve(false), 1000))]),
    notice: status === 'unauthenticated' ? <p className="text-xs leading-5 text-muted-foreground">
      {enabled ? 'Analytics is on: allowed details entered here, such as your email, message or delivery address, are saved with your guest activity even if this form is unfinished. ' : 'Optional guest form activity is off until you opt in through Analytics preferences. '}
      Password and payment credential fields are excluded. <button type="button" onClick={openCookiePreferences} className="underline underline-offset-4">Manage preferences</button>
    </p> : null,
  }
}
