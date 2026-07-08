export type CookieConsent = {
  necessary: true
  functional: boolean
  analytics: boolean
  marketing: boolean
  updatedAt: string
}

export const COOKIE_CONSENT_KEY = 'luxestore_cookie_consent'
export const OPEN_COOKIE_PREFERENCES_EVENT = 'luxestore:open-cookie-preferences'
export const COOKIE_CONSENT_UPDATED_EVENT = 'luxestore:cookie-consent-updated'

export const DEFAULT_CONSENT: CookieConsent = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  updatedAt: new Date(0).toISOString(),
}

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    return {
      necessary: true,
      functional: !!parsed.functional,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function saveConsent(consent: Omit<CookieConsent, 'necessary' | 'updatedAt'>) {
  if (typeof window === 'undefined') return
  const full: CookieConsent = {
    necessary: true,
    functional: consent.functional,
    analytics: consent.analytics,
    marketing: consent.marketing,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(full))
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, { detail: full }))
}

export function acceptAllConsent() {
  saveConsent({ functional: true, analytics: true, marketing: true })
}

export function rejectNonEssentialConsent() {
  saveConsent({ functional: false, analytics: false, marketing: false })
}

export function openCookiePreferences() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT))
}

export function hasConsentDecision(): boolean {
  return getStoredConsent() !== null
}
