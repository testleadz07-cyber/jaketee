export interface SecurityEnv {
  // Structural types keep workerd's global Request/Response declarations out
  // of the browser/Next tsconfig. Full Worker types are checked separately.
  SECURITY_LIMITER?: {
    idFromName(name: string): any
    get(id: any): { fetch(url: string, init: { method: string; body: string }): Promise<{ ok: boolean; json(): Promise<unknown> }> }
  }
  LOGIN_LIMITER?: { limit(input: { key: string }): Promise<{ success: boolean }> }
  API_LIMITER?: { limit(input: { key: string }): Promise<{ success: boolean }> }
}

export async function securityObject(env: SecurityEnv, key: string) {
  if (!env.SECURITY_LIMITER) throw new Error('SECURITY_LIMITER binding is required on Cloudflare')
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
  const name = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('')
  return env.SECURITY_LIMITER.get(env.SECURITY_LIMITER.idFromName(name))
}

export async function securityOperation(env: SecurityEnv, key: string, action: string, limit = 5, windowMs = 900000) {
  const object = await securityObject(env, key)
  const response = await object.fetch('https://security.internal/', {
    method: 'POST', body: JSON.stringify({ action, limit, windowMs }),
  })
  if (!response.ok) throw new Error('Security limiter unavailable')
  return response.json() as Promise<{ success: boolean; limit: number; remaining: number; resetAt: number; retryAfterSec?: number; locked: boolean }>
}
