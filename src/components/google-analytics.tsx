'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  COOKIE_CONSENT_KEY,
  getStoredConsent,
  type CookieConsent,
} from '@/lib/cookie-consent'

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-CBXZ857LW9'

declare global {
  interface Window {
    dataLayer?: IArguments[]
    gtag?: (...args: unknown[]) => void
    [key: `ga-configured-${string}`]: boolean | undefined
    [key: `ga-disable-${string}`]: boolean | undefined
  }
}

function configureGoogleAnalytics(analyticsAllowed: boolean) {
  if (!measurementId) return
  window[`ga-disable-${measurementId}`] = !analyticsAllowed
  // Basic consent mode: do not initialize or load Google before opt-in.
  if (!analyticsAllowed && !window[`ga-configured-${measurementId}`]) return
  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag() {
    // Preserve the command format used by Google's gtag bootstrap.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments)
  }
  const alreadyConfigured = window[`ga-configured-${measurementId}`]
  if (!alreadyConfigured) {
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500,
    })
  }

  window.gtag('consent', 'update', {
    analytics_storage: analyticsAllowed ? 'granted' : 'denied',
  })

  if (!alreadyConfigured) {
    window[`ga-configured-${measurementId}`] = true
    window.gtag('js', new Date())
    window.gtag('config', measurementId, {
      anonymize_ip: true,
      send_page_view: false,
    })
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname()
  const [initialized, setInitialized] = useState(false)
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false)

  useEffect(() => {
    const applyConsent = (consent: CookieConsent | null) => {
      const allowed = Boolean(consent?.analytics)
      configureGoogleAnalytics(allowed)
      setAnalyticsAllowed(allowed)
      setInitialized(true)
    }

    applyConsent(getStoredConsent())
    const handleConsentUpdate = (event: Event) => {
      applyConsent((event as CustomEvent<CookieConsent>).detail)
    }
    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === COOKIE_CONSENT_KEY || event.key === null) applyConsent(getStoredConsent())
    }
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, handleConsentUpdate)
    window.addEventListener('storage', handleStorageUpdate)
    return () => {
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, handleConsentUpdate)
      window.removeEventListener('storage', handleStorageUpdate)
    }
  }, [])

  useEffect(() => {
    if (!measurementId || !initialized || !analyticsAllowed || !getStoredConsent()?.analytics || !window.gtag) return

    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: `${window.location.origin}${pathname}`,
      page_path: pathname,
    })
  }, [initialized, pathname, analyticsAllowed])

  if (!measurementId || !initialized || !analyticsAllowed) return null

  return (
    <Script
      id="jacketee-google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      strategy="afterInteractive"
    />
  )
}
