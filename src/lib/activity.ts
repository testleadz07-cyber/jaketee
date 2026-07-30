/**
 * Log user (or guest) activity to the server. Best-effort - never throws.
 * Country is resolved server-side from platform geo headers (Netlify/Vercel),
 * so no client-side network call is needed here.
 */
export async function logUserActivity(action: string, details?: Record<string, any>) {
  try {
    const res = await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details }),
    })
    return res.ok
  } catch {
    return false
  }
}
