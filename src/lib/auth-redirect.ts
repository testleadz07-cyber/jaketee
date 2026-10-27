export function getSafeAuthCallback(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x1f]/.test(value)) return null
  const url = new URL(value, 'https://auth.invalid')
  const path = url.pathname
  let decodedPath: string
  try { decodedPath = decodeURIComponent(path) } catch { return null }
  if (path.startsWith('//') || decodedPath.startsWith('//') || /[\\\x00-\x1f]/.test(decodedPath)) return null
  if (/^\/(login|register)(\/|$)/.test(decodedPath) || /^\/auth\/complete(\/|$)/.test(decodedPath) || decodedPath.startsWith('/api/auth')) return null
  return `${path}${url.search}${url.hash}`
}

export function getPostSignInDestination(role: unknown, callbackUrl?: string | null): string {
  const callback = getSafeAuthCallback(callbackUrl)
  if (callback && (role === 'admin' || !decodeURIComponent(new URL(callback, 'https://auth.invalid').pathname).startsWith('/admin'))) return callback
  return role === 'admin' ? '/admin/dashboard' : '/profile'
}

export function getGoogleCompletionUrl(callbackUrl?: string | null) {
  const callback = getSafeAuthCallback(callbackUrl)
  return callback ? `/auth/complete?callbackUrl=${encodeURIComponent(callback)}` : '/auth/complete'
}
