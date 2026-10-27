'use client'

import { createPushRegistration, pushRequest, waitForPushWorker, withPushTimeout } from '@/lib/push-registration'

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}
export function isFirebaseClientConfigured() {
  return Boolean(config.apiKey && config.projectId && config.messagingSenderId && config.appId && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY)
}
export async function browserMessaging() {
  if (!isFirebaseClientConfigured()) throw new Error('Firebase notifications have not been configured yet.')
  const [{ getApps, initializeApp }, sdk] = await Promise.all([import('firebase/app'), import('firebase/messaging')])
  if (!await sdk.isSupported()) throw new Error('Push is unsupported. On iPhone, add Jacketee to your Home Screen and open it there.')
  const app = getApps().find(a => a.name === 'jacketee-web') || initializeApp(config, 'jacketee-web')
  return { messaging: sdk.getMessaging(app), sdk }
}
export const registerPushDevice = createPushRegistration(async progress => {
  if (!window.isSecureContext || !('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('Notifications require HTTPS or http://localhost. A plain HTTP network IP cannot enable push.')
  progress('Loading notification support…')
  const { messaging, sdk } = await withPushTimeout(browserMessaging(), 'Loading notification support took too long. Reload this page and try again.')
  progress('Registering the notification worker…')
  const registration = await withPushTimeout(navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/', updateViaCache: 'none' }), 'Registering the notification worker took too long. Reload this page and try again.')
  progress('Starting the notification worker…')
  await waitForPushWorker(registration)
  progress('Connecting this browser to Firebase…')
  const token = await withPushTimeout(sdk.getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration }), 'Firebase registration timed out. Check your connection, browser push permissions, and Firebase Cloud Messaging / FCM Registration API settings, then try again.', 30_000)
  if (!token) throw new Error('Unable to register this device. Please try again.')
  progress('Saving this device…')
  await pushRequest('POST', token)
  return token
})
