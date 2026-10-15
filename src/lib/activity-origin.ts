/** Caddy preserves Host even when Next's internal request URL uses localhost. */
export function hasValidActivityOrigin(request: { headers: Headers; nextUrl: URL }) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    const parsed = new URL(origin)
    const host = request.headers.get('host') || request.nextUrl.host
    return parsed.origin === origin && ['http:', 'https:'].includes(parsed.protocol) && parsed.host.toLowerCase() === host.toLowerCase()
  } catch { return false }
}
