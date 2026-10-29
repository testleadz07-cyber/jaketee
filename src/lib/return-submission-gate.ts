import 'server-only'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { securityObject, type SecurityEnv } from './cloudflare-security'

export async function returnSubmissionGate(orderId: string, action: 'returns-reserve' | 'returns-complete', details: { settledIds?: string[]; id?: string } = {}) {
  const env = getCloudflareContext().env as SecurityEnv
  const object = await securityObject(env, 'returns-order:' + orderId)
  const response = await object.fetch('https://security.internal/', {
    method: 'POST', body: JSON.stringify({ action, ...details }),
  })
  if (!response.ok) throw Error('Return submission protection unavailable')
  const result = await response.json() as { status: string; id?: string }
  if (!['reserved', 'busy', 'limited', 'complete'].includes(result.status) ||
      (result.status === 'reserved' && !/^[a-f0-9]{24}$/.test(result.id || ''))) throw Error('Invalid return reservation')
  return result
}
