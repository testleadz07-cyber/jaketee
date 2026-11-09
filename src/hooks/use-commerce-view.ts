'use client'

import { useEffect, useRef } from 'react'
import { COOKIE_CONSENT_UPDATED_EVENT } from '@/lib/cookie-consent'
import { GA_READY_EVENT, sendCommerceEvent, type CommerceItem } from '@/lib/ga-ecommerce'

/** Wait for consent and tag configuration; avoid duplicate effects and cart hydration changes. */
export function useCommerceView(name: 'view_item' | 'begin_checkout', items: CommerceItem[], key: string) {
  const sent = useRef<string | null>(null)
  const serialized = JSON.stringify(items)
  useEffect(() => {
    const send = () => {
      if (sent.current === key) return
      if (sendCommerceEvent(name, JSON.parse(serialized))) sent.current = key
    }
    send()
    window.addEventListener(GA_READY_EVENT, send)
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, send)
    return () => {
      window.removeEventListener(GA_READY_EVENT, send)
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, send)
    }
  }, [name, key, serialized])
}
