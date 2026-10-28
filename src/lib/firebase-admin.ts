import { isPushConfigured } from '@/lib/push-config'
import { getWorkerRequestScope } from './worker-request-scope'
export { isPushConfigured }

interface MulticastMessage { tokens: string[]; data?: Record<string, string>; webpush?: { headers?: Record<string, string> } }
interface SendResult { success: boolean; messageId?: string; error?: { code: string; message: string } }
let cachedToken: { value: string; expiresAt: number; identity: string } | undefined
let cachedKey: { key: CryptoKey; pem: string } | undefined
const base64url = (value: string | Uint8Array) => Buffer.from(value).toString('base64url')

async function accessToken() {
  const email = process.env.FIREBASE_CLIENT_EMAIL!
  const pem = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n')
  if (cachedToken?.identity === email && cachedToken.expiresAt > Date.now() + 60000) return cachedToken.value
  if (cachedKey?.pem !== pem) {
    const raw = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '')
    const bytes = new Uint8Array(Buffer.from(raw, 'base64'))
    cachedKey = { pem, key: await crypto.subtle.importKey('pkcs8', bytes, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']) }
  }
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(JSON.stringify({ iss: email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }))
  const unsigned = header + '.' + claims
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cachedKey.key, new TextEncoder().encode(unsigned))
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + base64url(new Uint8Array(signature)) }),
    signal: AbortSignal.timeout(15000),
  })
  const result = await response.json() as { access_token?: string; expires_in?: number }
  if (!response.ok || !result.access_token) throw new Error('FCM authorization unavailable')
  cachedToken = { value: result.access_token, expiresAt: Date.now() + (result.expires_in || 3600) * 1000, identity: email }
  return cachedToken.value
}

export function adminMessaging() {
  if (!isPushConfigured()) throw new Error('Push notifications are not configured')
  return {
    async sendEachForMulticast(message: MulticastMessage) {
      if (message.tokens.length > 500) throw new Error('FCM supports at most 500 multicast tokens')
      const responses: SendResult[] = []
      const allowed = new Set((process.env.PUSH_TEST_TOKENS || '').split(',').filter(Boolean))
      const scope = getWorkerRequestScope()
      let token: string | undefined
      for (const recipient of message.tokens) {
        if (process.env.MIGRATION_TEST_MODE === 'true' && !allowed.has(recipient)) {
          responses.push({ success: false, error: { code: 'messaging/unavailable', message: 'Device is not permitted in migration tests' } }); continue
        }
        const used = (scope?.values.get('fcm-sends') as number | undefined) || 0
        // Leave subrequest headroom for MongoDB, auth, email and rate limiting.
        // Unsent devices stay pending in the existing persisted notification queue.
        if (scope && used >= 20) {
          responses.push({ success: false, error: { code: 'messaging/unavailable', message: 'Worker delivery budget reached; retry pending' } }); continue
        }
        if (scope) scope.values.set('fcm-sends', used + 1)
        try {
          token ??= await accessToken()
          const response = await fetch('https://fcm.googleapis.com/v1/projects/' + encodeURIComponent(process.env.FIREBASE_PROJECT_ID!) + '/messages:send', {
            method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
            body: JSON.stringify({ message: { token: recipient, data: message.data, webpush: message.webpush } }), signal: AbortSignal.timeout(15000),
          })
          const result = await response.json() as { name?: string; error?: { status?: string; details?: Array<{ errorCode?: string }> } }
          if (response.ok && result.name) responses.push({ success: true, messageId: result.name })
          else {
            const unregistered = result.error?.details?.some(item => item.errorCode === 'UNREGISTERED')
            if (response.status === 401) cachedToken = undefined
            responses.push({ success: false, error: { code: unregistered ? 'messaging/registration-token-not-registered' : 'messaging/unavailable', message: 'FCM request failed (' + response.status + ')' } })
          }
        } catch { responses.push({ success: false, error: { code: 'messaging/unavailable', message: 'FCM temporarily unavailable' } }) }
      }
      const successCount = responses.filter(item => item.success).length
      return { responses, successCount, failureCount: responses.length - successCount }
    },
  }
}
