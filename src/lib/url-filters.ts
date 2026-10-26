export type UrlFilterValue = string | number | string[]

export function readUrlFilter<T extends UrlFilterValue>(params: URLSearchParams, key: string, fallback: T): T {
  if (!params.has(key)) return fallback
  if (Array.isArray(fallback)) return [...new Set(params.getAll(key).filter(Boolean))].slice(0, 50) as T
  if (typeof fallback === 'number') {
    const value = Number(params.get(key))
    return (Number.isSafeInteger(value) && value > 0 && value <= 100000 ? value : fallback) as T
  }
  return (params.get(key) || '').slice(0, 200) as T
}

export function writeUrlFilter(params: URLSearchParams, key: string, value: UrlFilterValue, fallback: UrlFilterValue) {
  params.delete(key)
  if (Array.isArray(value)) {
    // An explicit empty value distinguishes "exclude nothing" from the default exclusions.
    if (!value.length && Array.isArray(fallback) && fallback.length) params.set(key, '')
    else value.forEach(item => params.append(key, item))
  } else if (value !== fallback) params.set(key, String(value))
}
