'use client'

import { getStoredConsent } from '@/lib/cookie-consent'

export const GA_READY_EVENT = 'jacketee:ga-ready'
const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-CBXZ857LW9'

export interface CommerceItem {
  productId: string
  name: string
  price: number
  quantity: number
}

const sentPurchases = new Set<string>()

/** Only catalog identifiers and prices: never artwork, customer details or custom text. */
export function sendCommerceEvent(
  name: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase',
  products: CommerceItem[],
  purchase?: { transactionId: string; shipping: number; tax: number; value: number },
): boolean {
  if (typeof window === 'undefined' || !getStoredConsent()?.analytics || !window.gtag ||
    !window[`ga-configured-${measurementId}`] || window[`ga-disable-${measurementId}`]) return false
  const items = products.filter(item => item.productId && item.name && Number.isFinite(item.price) && item.price >= 0 &&
    Number.isInteger(item.quantity) && item.quantity > 0).map(item => ({
    item_id: item.productId, item_name: item.name, price: item.price, quantity: item.quantity,
  }))
  if (!items.length || items.length !== products.length) return false
  const key = purchase ? `jacketee:ga-purchase:${purchase.transactionId}` : null
  if (purchase && (!purchase.transactionId || ![purchase.shipping, purchase.tax, purchase.value].every(value => Number.isFinite(value) && value >= 0))) return false
  if (key) {
    if (sentPurchases.has(key)) return false
    try { if (localStorage.getItem(key)) return false } catch { /* Memory dedup remains available. */ }
  }
  try {
    window.gtag('event', name, {
      currency: 'USD',
      value: purchase?.value ?? Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100,
      items,
      ...(purchase ? { transaction_id: purchase.transactionId, shipping: purchase.shipping, tax: purchase.tax } : {}),
    })
    if (key) {
      sentPurchases.add(key)
      try { localStorage.setItem(key, '1') } catch { /* GA also deduplicates by transaction_id. */ }
    }
    return true
  } catch { return false }
}
