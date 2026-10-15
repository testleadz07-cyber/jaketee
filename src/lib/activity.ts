import { getStoredConsent } from '@/lib/cookie-consent'
import { parseActivity, type AnalyticsEventName } from '@/lib/activity-schema'
import { enqueueActivityRequest } from '@/lib/activity-transport'
export type { AnalyticsEventName } from '@/lib/activity-schema'
export { resetGuestActivityIdentity } from '@/lib/activity-transport'

/** Optional, best-effort analytics; strip unapproved details before transmission. */
export async function logUserActivity(action: AnalyticsEventName, details?: Record<string, unknown>) {
  const consent = getStoredConsent()
  if (!consent?.analytics || typeof window === 'undefined') return false
  let event: ReturnType<typeof parseActivity>
  try {
    event = parseActivity({ action, details: { ...details, path: window.location.pathname } })
  } catch { return false }
  return enqueueActivityRequest(async () => {
    // Consent may have changed while an earlier request was in flight.
    const currentConsent = getStoredConsent()
    if (!currentConsent?.analytics || currentConsent.updatedAt !== consent.updatedAt) return false
    try {
      const res = await fetch('/api/activity', {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', 'x-analytics-consent': 'granted' },
        body: JSON.stringify(event),
      })
      return res.ok
    } catch { return false }
  })
}
