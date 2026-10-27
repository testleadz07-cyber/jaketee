import { scheduleNotificationPush } from '@/lib/notification-delivery'
import { connectDB } from '@/lib/mongodb'
import Notification, { NotificationType } from '@/models/Notification'

/**
 * Creates an admin-facing in-app notification. Best-effort - never throws,
 * so a notification failure can't block the triggering action (registration,
 * a form submission, etc).
 */
export async function createNotification({
  type,
  title,
  message,
  link,
  metadata,
  eventKey,
}: {
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: Record<string, any>
  eventKey?: string
}) {
  try {
    const db = await connectDB()
    if (!db) return
    await Notification.init()
    const notification = await Notification.create({ type, title, message, link, metadata, pushState: 'pending', pushNextAttemptAt: new Date(), ...(eventKey ? { eventKey } : {}) })
    scheduleNotificationPush(String(notification._id))
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return
    console.error('Failed to create notification:', error)
  }
}

export async function notifyOrder(order: { _id: unknown; orderNumber: string }, paid = false) {
  await createNotification({
    type: paid ? 'payment_received' : 'new_order',
    title: paid ? 'Payment received' : 'New order',
    message: `${paid ? 'Payment confirmed for' : 'Created'} order ${order.orderNumber}.`,
    link: `/admin/orders/${order._id}`,
    eventKey: `${paid ? 'paid' : 'order'}:${order._id}`,
  })
}
