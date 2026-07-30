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
}: {
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: Record<string, any>
}) {
  try {
    const db = await connectDB()
    if (!db) return
    await Notification.create({ type, title, message, link, metadata })
  } catch (error) {
    console.error('Failed to create notification:', error)
  }
}
