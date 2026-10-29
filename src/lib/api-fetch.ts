'use client'

import { invalidatePublicJson } from './public-json'

/** Bound reads without retrying mutations or payment requests. */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
  const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()
  if (method !== 'GET' || !url.startsWith('/api/')) {
    return globalThis.fetch(input, init).then(response => {
      if (response.ok && method !== 'GET' && /^\/api\/(products|categories|reviews|admin\/(blog|blog-categories|faqs|tags|bulk-edit|reviews|home-cache))(\/|\?|$)/.test(url)) invalidatePublicJson()
      return response
    })
  }
  const parent = init?.signal || (input instanceof Request ? input.signal : undefined)
  const timeout = AbortSignal.timeout(20_000)
  return globalThis.fetch(input, {
    ...init, cache: init?.cache || 'no-store',
    signal: parent ? AbortSignal.any([parent, timeout]) : timeout,
  })
}
