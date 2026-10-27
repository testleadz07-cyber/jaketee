import { adminMessaging, isPushConfigured } from '@/lib/firebase-admin'
import PushDevice from '@/models/PushDevice'
import User from '@/models/User'
import LoginSession from '@/models/LoginSession'

export async function sendAdminPush({ id, type, link, userId, token, excludeTokens = [], onDelivered }: { id: string; type: string; link?: string; userId?: string; token?: string; excludeTokens?: string[]; onDelivered?: (tokens: string[]) => Promise<void> }) {
  if (!isPushConfigured()) return { configured: false, successCount: 0, failureCount: 0, targetCount: 0 }
  const admins = await User.find({ role: 'admin', isActive: { $ne: false }, ...(userId ? { _id: userId } : {}) }).select('_id').lean()
  // Closing Chrome ends analytics activity, not the authenticated subscription.
  const sessions = await LoginSession.find({ userId: { $in: admins.map(u => u._id) }, revokedAt: null }).select('_id').lean()
  const devices = await PushDevice.find({ userId: { $in: admins.map(u => u._id) }, loginSessionId: { $in: sessions.map(s => s._id) }, expiresAt: { $gt: new Date() }, ...(token ? { token } : {}) }).select('_id token').lean()
  const excluded = new Set(excludeTokens)
  const pending = devices.filter(device => !excluded.has(device.token))
  let successCount = 0, failureCount = 0
  // Bounded batches stay below the Admin SDK's multicast limit.
  for (let i = 0; i < pending.length; i += 500) {
    const batch = pending.slice(i, i + 500)
    const result = await adminMessaging().sendEachForMulticast({
      tokens: batch.map(d => d.token),
      data: { id, type, title: 'Jacketee Admin', body: type === 'test' ? 'Push notifications are working on this device.' : 'You have a new admin notification. Open Jacketee to view details.', url: link?.startsWith('/admin/') ? link : '/admin/notifications' },
      webpush: { headers: { TTL: '3600', Urgency: 'high' } },
    })
    successCount += result.successCount; failureCount += result.failureCount
    const delivered = batch.filter((_, index) => result.responses[index].success).map(device => device.token)
    if (delivered.length && onDelivered) await onDelivered(delivered)
    const expired = batch.filter((_, index) => ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(result.responses[index].error?.code || ''))
    if (expired.length) await PushDevice.deleteMany({ _id: { $in: expired.map(d => d._id) } })
  }
  return { configured: true, successCount, failureCount, targetCount: devices.length }
}
