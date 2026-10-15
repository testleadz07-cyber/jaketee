let pending: Promise<unknown> = Promise.resolve()

/** Serialize cookie-setting requests within a tab and across supporting browsers. */
export function enqueueActivityRequest<T>(operation: () => Promise<T>): Promise<T> {
  const next = pending.then(async () => {
    if (typeof navigator !== 'undefined' && navigator.locks) {
      return navigator.locks.request('jacketee-guest-activity', operation)
    }
    return operation()
  })
  pending = next.catch(() => {})
  return next
}

export function resetGuestActivityIdentity() {
  return enqueueActivityRequest(async () => {
    try {
      const res = await fetch('/api/activity', {
        method: 'DELETE', keepalive: true,
        headers: { 'x-analytics-consent': 'denied' },
      })
      return res.ok
    } catch { return false }
  })
}
