import 'server-only'
import { NextResponse } from 'next/server'

export type TurnstileAction = 'login' | 'register' | 'forgot_password' | 'contact' | 'bulk_quote' | 'newsletter' | 'returns'

/** Tokens are single-use: verify before any database write, login or email. */
export async function verifyTurnstile(token: unknown, action: TurnstileAction): Promise<boolean> {
  if (typeof token !== 'string' || !token || token.length > 2048) return false
  const development = process.env.NODE_ENV === 'development'
  const secret = development ? '1x0000000000000000000000000000000AA' : process.env.TURNSTILE_SECRET_KEY
  if (!secret || (!development && secret.startsWith('1x000000'))) return false
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) return false
    const result = await response.json()
    if (result.success !== true) return false
    // Cloudflare's development keys deliberately do not enforce action/hostname.
    if (development) return true
    const hostnames = (process.env.TURNSTILE_HOSTNAMES || 'jacketee.com,www.jacketee.com')
      .split(',').map(host => host.trim().toLowerCase()).filter(Boolean)
    return result.action === action && typeof result.hostname === 'string' && hostnames.includes(result.hostname.toLowerCase())
  } catch {
    // Fail closed on configuration/network/provider failure. Never log tokens.
    console.error('Turnstile verification unavailable')
    return false
  }
}

export async function requireTurnstile(token: unknown, action: TurnstileAction) {
  if (await verifyTurnstile(token, action)) return null
  return NextResponse.json({ error: 'Security verification failed. Please try again.' }, {
    status: 403, headers: { 'Cache-Control': 'no-store' },
  })
}
