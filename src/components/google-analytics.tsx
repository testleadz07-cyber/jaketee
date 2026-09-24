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
    [key: `ga-disable-${string}`]: boolean | undefined
  }
}

function configureGoogleAnalytics() {
  if (!measurementId) return
  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer?.push(args)
  }
  window[`ga-disable-${measurementId}`] = false
  window.gtag('consent', 'update', { analytics_storage: 'granted' })
  window.gtag('js', new Date())
  window.gtag('config', measurementId, {
    anonymize_ip: true,
    send_page_view: false,
  })
}

export function GoogleAnalytics() {
  const pathname = usePathname()
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false)

  useEffect(() => {
    const applyConsent = (consent: CookieConsent | null) => {
      const allowed = Boolean(consent?.analytics)
      if (measurementId) {
        window[`ga-disable-${measurementId}`] = !allowed
      }
      if (!allowed) {
        window.gtag?.('consent', 'update', { analytics_storage: 'denied' })
      }
      setAnalyticsAllowed(allowed)
      if (allowed) configureGoogleAnalytics()
    }

    applyConsent(getStoredConsent())
    const handleConsentUpdate = (event: Event) => {
      applyConsent((event as CustomEvent<CookieConsent>).detail)
    }
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, handleConsentUpdate)
    return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, handleConsentUpdate)
  }, [])

  useEffect(() => {
    if (!measurementId || !analyticsAllowed || !window.gtag) return

    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: pathname,
    })
  }, [analyticsAllowed, pathname])

  if (!measurementId || !analyticsAllowed) return null

  return (
    <Script
      id="jacketee-google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      strategy="afterInteractive"
    />
  )
}
