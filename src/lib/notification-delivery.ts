import { after } from 'next/server'
import { randomUUID } from 'crypto'
import { connectDB } from '@/lib/mongodb'
import Notification from '@/models/Notification'
import { isPushConfigured } from '@/lib/push-config'

// Persist before responding; deliver after responding. A crashed invocation leaves
// a recoverable lease rather than losing the notification or retrying forever in memory.
async function deliverPendingNotifications(limit = 5, notificationId?: string) {
  if (!isPushConfigured() || !await connectDB()) return
  const { sendAdminPush } = await import('@/lib/push-notifications')
  const deadline = Date.now() + 40_000
  for (let index = 0; index < limit && Date.now() < deadline; index++) {
    const now = new Date()
    const leaseId = randomUUID()
    const notification = await Notification.findOneAndUpdate({
      pushState: 'pending', pushNextAttemptAt: { $lte: now },
      ...(notificationId ? { _id: notificationId } : {}),
      $or: [{ pushLeaseUntil: { $exists: false } }, { pushLeaseUntil: { $lte: now } }],
    }, { $set: { pushLeaseUntil: new Date(now.getTime() + 5 * 60_000), pushLeaseId: leaseId }, $inc: { pushAttempts: 1 } }, {
      sort: { pushNextAttemptAt: 1, _id: 1 }, returnDocument: 'after',
    }).select('+pushDeliveredTokens').lean()
    if (!notification) return
    const ownership = { _id: notification._id, pushLeaseId: leaseId }
    let sent = false
    try {
      const result = await sendAdminPush({
        id: String(notification._id), type: notification.type, link: notification.link,
        excludeTokens: notification.pushDeliveredTokens || [],
        onDelivered: async tokens => { await Notification.updateOne(ownership, { $addToSet: { pushDeliveredTokens: { $each: tokens } } }) },
      })
      // No enabled device is not delivery. Keep the saved notification pending.
      sent = result.configured && result.targetCount > 0 && result.failureCount === 0
    } catch {
      console.error('Admin push deferred for retry', { notificationId: String(notification._id) })
    }
    const delay = Math.min(60 * 60_000, 60_000 * 2 ** Math.min(Number(notification.pushAttempts || 1) - 1, 6))
    await Notification.updateOne(ownership, {
      $set: { pushState: sent ? 'sent' : 'pending', pushNextAttemptAt: new Date(Date.now() + delay) },
      $unset: { pushLeaseUntil: 1, pushLeaseId: 1 },
    })
  }
}

export function scheduleNotificationPush(notificationId: string) {
  try {
    after(async () => {
      try { await deliverPendingNotifications(1, notificationId) }
      catch { console.error('Admin push queue unavailable; saved notifications remain pending') }
    })
  } catch {
    // E.g. a script without a Next request context. The persisted queue survives.
    console.error('Admin push scheduling unavailable; saved notifications remain pending')
  }
}

export function scheduleDailyAdminPushRetry(userId: string) {
  try {
    after(async () => {
      try {
        if (!isPushConfigured() || !await connectDB()) return
        const User = (await import('@/models/User')).default
        if (!await User.exists({ _id: userId, role: 'admin', isActive: { $ne: false } })) return
        const State = (await import('@/models/NotificationRetryState')).default
        const now = new Date()
        const day = now.toISOString().slice(0, 10) // One shared run per UTC calendar day.
        try {
          await State.findOneAndUpdate({ _id: 'admin-push-retry', day: { $ne: day } }, {
            $set: { day, attemptedAt: now },
          }, { upsert: true, returnDocument: 'after' })
        } catch (error) {
          // The singleton _id makes concurrent or later logins on the same day no-ops.
          if ((error as { code?: number }).code === 11000) return
          throw error
        }
        await deliverPendingNotifications(100)
      } catch { console.error('Daily admin login push retry deferred; notifications remain saved') }
    })
  } catch { console.error('Admin login push retry could not be scheduled; notifications remain saved') }
}
