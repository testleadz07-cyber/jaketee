import { createJSONStorage } from 'zustand/middleware'
import { getStoredConsent } from '@/lib/cookie-consent'

// Keep the feature usable in memory; only persist it when Functional is enabled.
export function createFunctionalStorage<T>() {
  return createJSONStorage<T>(() => ({
  getItem(name: string) {
    try {
      if (!getStoredConsent()?.functional) { window.localStorage.removeItem(name); return null }
      return window.localStorage.getItem(name)
    } catch { return null }
  },
  setItem(name: string, value: string) {
    try {
      if (getStoredConsent()?.functional) window.localStorage.setItem(name, value)
      else window.localStorage.removeItem(name)
    } catch { /* Browser storage may be unavailable. */ }
  },
  removeItem(name: string) {
    try { window.localStorage.removeItem(name) } catch { /* Browser storage may be unavailable. */ }
  },
  }))
}
