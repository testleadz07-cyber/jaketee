import { getCloudflareContext } from '@opennextjs/cloudflare'
import * as memory from './rate-limit-memory'
import { securityOperation, type SecurityEnv } from './cloudflare-security'
import { getWorkerRequestScope } from './worker-request-scope'
export { rateLimitHeaders } from './rate-limit-memory'

export function getClientIp(request: Request) {
  return memory.getClientIp(request, Boolean(getWorkerRequestScope()))
}

function cloudflareEnv(): SecurityEnv | undefined {
  // next dev exposes Wrangler bindings through OpenNext's dev bridge, but
  // same-worker Durable Objects are not exported by that bridge. Use the
  // existing in-memory limiter only for Next development outside a Worker.
  if (process.env.NODE_ENV === 'development' && !getWorkerRequestScope()) return undefined
  try { return getCloudflareContext().env as SecurityEnv } catch {
    if (getWorkerRequestScope()) throw new Error('Cloudflare request context is unavailable')
    return undefined
  }
}
export async function checkRateLimit(key: string, limit: number, windowMs: number) {
  const env = cloudflareEnv()
  return env ? securityOperation(env, key, 'limit', limit, windowMs) : memory.checkRateLimit(key, limit, windowMs)
}
export async function isLoginLocked(identifier: string) {
  const env = cloudflareEnv()
  return env ? securityOperation(env, 'login-attempts:' + identifier.toLowerCase().trim(), 'check') : memory.isLoginLocked(identifier)
}
export async function recordFailedLogin(identifier: string) {
  const env = cloudflareEnv()
  if (env) await securityOperation(env, 'login-attempts:' + identifier.toLowerCase().trim(), 'record')
  else memory.recordFailedLogin(identifier)
}
export async function resetLoginAttempts(identifier: string) {
  const env = cloudflareEnv()
  if (env) await securityOperation(env, 'login-attempts:' + identifier.toLowerCase().trim(), 'reset')
  else memory.resetLoginAttempts(identifier)
}
