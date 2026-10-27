// Keep configuration checks independent of the Firebase Admin SDK so merely
// opening notification settings does not compile/load Google's server SDKs.
export function isPushConfigured() {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY)
}
