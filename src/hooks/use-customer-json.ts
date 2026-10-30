'use client'

import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/lib/api-fetch'

// In-flight reads only: never cache completed customer data across pages or
// accounts. StrictMode's repeated effect subscribes to the same pending read.
export function useCustomerJson<T>(owner: string | undefined, url: string | null, shape: 'array' | 'object') {
  const key = owner && url ? JSON.stringify([owner, url]) : null
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string | null; attempt: number; data: T | null; error: string; loading: boolean }>({
    key: null, attempt: 0, data: null, error: '', loading: false,
  })
  const pending = useRef<{ key: string; attempt: number; promise: Promise<T> } | null>(null)
  const retrying = useRef(false)
  useEffect(() => {
    let active = true
    retrying.current = false
    if (!key || !url) {
      pending.current = null
      setResult({ key: null, attempt, data: null, error: '', loading: false })
      return
    }
    setResult({ key, attempt, data: null, error: '', loading: true })
    let request = pending.current
    if (!request || request.key !== key || request.attempt !== attempt) {
      const promise = apiFetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20000) }).then(async response => {
        if (!response.ok) throw new Error('Customer data unavailable')
        const data = await response.json()
        if (shape === 'array' ? !Array.isArray(data) : !data || typeof data !== 'object' || Array.isArray(data)) {
          throw new Error('Invalid customer data')
        }
        return data as T
      })
      request = { key, attempt, promise }
      pending.current = request
    }
    const current = request
    current.promise.then(data => {
      if (active) setResult({ key, attempt, data, error: '', loading: false })
    }, () => {
      if (active) setResult({ key, attempt, data: null, error: 'Could not load your order information. Please retry.', loading: false })
    }).finally(() => {
      if (pending.current === current) pending.current = null
    })
    return () => { active = false }
  }, [key, url, shape, attempt])
  // Hide old-account/old-order state immediately, before the new effect runs.
  const matches = result.key === key && result.attempt === attempt
  const loading = Boolean(key) && (!matches || result.loading)
  return {
    data: matches ? result.data : null,
    error: matches ? result.error : '',
    loading,
    retry: () => {
      if (!key || loading || retrying.current) return
      retrying.current = true
      setAttempt(value => value + 1)
    },
  }
}
