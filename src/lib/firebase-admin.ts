import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { isPushConfigured } from '@/lib/push-config'

export { isPushConfigured }

export function adminMessaging() {
  if (!isPushConfigured()) throw new Error('Push notifications are not configured')
  const app = getApps().find(a => a.name === 'jacketee-push') || initializeApp({ credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }) }, 'jacketee-push')
  return getMessaging(app)
}
