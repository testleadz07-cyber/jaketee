'use client'

import { useCallback, useEffect, useMemo, useSyncExternalStore, type Dispatch, type SetStateAction } from 'react'
import { readUrlFilter, writeUrlFilter, type UrlFilterValue } from '@/lib/url-filters'

const event = 'url-filters-changed'
const subscribe = (listener: () => void) => {
  window.addEventListener(event, listener)
  window.addEventListener('popstate', listener)
  return () => { window.removeEventListener(event, listener); window.removeEventListener('popstate', listener) }
}
const snapshot = () => window.location.search
const serverSnapshot = () => ''

export function useFilterSearch() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot)
}

export function updateFilterUrl(update: (params: URLSearchParams) => void) {
  const url = new URL(window.location.href)
  update(url.searchParams)
  if (url.href === window.location.href) return
  window.history.replaceState(window.history.state, '', url)
  window.dispatchEvent(new Event(event))
}

export function useUrlFilter<T extends UrlFilterValue>(key: string, fallback: T): [T, Dispatch<SetStateAction<T>>] {
  // Serialize array defaults so callers can pass literals without changing effect dependencies.
  const defaults = JSON.stringify(fallback)
  useEffect(() => {
    const initial = JSON.parse(defaults) as T
    if (Array.isArray(initial) && initial.length && !new URLSearchParams(window.location.search).has(key)) {
      updateFilterUrl(params => writeUrlFilter(params, key, initial, initial))
    }
  }, [key, defaults])
  const setValue = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    const initial = JSON.parse(defaults) as T
    updateFilterUrl(params => {
      const current = readUrlFilter(params, key, initial)
      const result = typeof next === 'function' ? next(current) : next
      if (JSON.stringify(current) === JSON.stringify(result)) return
      writeUrlFilter(params, key, result, initial)
      if (key !== 'page') params.delete('page')
    })
  }, [key, defaults])
  // Arrays need stable identity: fetch callbacks often depend on them.
  const stableValue = useSyncExternalStore(
    subscribe,
    useCallback(() => JSON.stringify(readUrlFilter(new URLSearchParams(window.location.search), key, JSON.parse(defaults) as T)), [key, defaults]),
    useCallback(() => defaults, [defaults]),
  )
  const value = useMemo(() => JSON.parse(stableValue) as T, [stableValue])
  return [value, setValue]
}
