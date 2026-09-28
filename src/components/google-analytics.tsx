'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  getStoredConsent,
  type CookieConsent,
} from '@/lib/cookie-consent'

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

declare global {
  interface Window {
    dataLayer?: unknown[][]
    gtag?: (...args: unknown[]) => void
    [key: `ga-configured-${string}`]: boolean | undefined
  }
}

function configureGoogleAnalytics(analyticsAllowed: boolean) {
  if (!measurementId) return
  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer?.push(args)
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

  useEffect(() => {
    const applyConsent = (consent: CookieConsent | null) => {
      const allowed = Boolean(consent?.analytics)
      configureGoogleAnalytics(allowed)
      setInitialized(true)
    }

    applyConsent(getStoredConsent())
    const handleConsentUpdate = (event: Event) => {
      applyConsent((event as CustomEvent<CookieConsent>).detail)
    }
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, handleConsentUpdate)
    return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, handleConsentUpdate)
  }, [])

  useEffect(() => {
    if (!measurementId || !initialized || !window.gtag) return

    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: `${window.location.origin}${pathname}`,
      page_path: pathname,
    })
  }, [initialized, pathname])

  if (!measurementId || !initialized) return null

  return (
    <Script
      id="jacketee-google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      strategy="afterInteractive"
    />
  )
}
