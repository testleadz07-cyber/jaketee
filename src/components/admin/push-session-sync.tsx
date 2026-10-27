'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { isFirebaseClientConfigured, registerPushDevice } from '@/lib/firebase-client'
import { toast } from 'sonner'

export function PushSessionSync() {
  const { data: session } = useSession()
  const user = session?.user as { id?: string; role?: string } | undefined
  useEffect(() => {
    if (user?.role !== 'admin' || !isFirebaseClientConfigured() || !('serviceWorker' in navigator)) return
    let lastRefresh = 0
    const refresh = () => {
      if (document.visibilityState !== 'visible' || Date.now() - lastRefresh < 60_000) return
      if ('Notification' in window && Notification.permission === 'granted' && localStorage.getItem('jacketee-push-user') === user.id) {
        lastRefresh = Date.now(); registerPushDevice().catch(() => {})
      }
    }
    const receive = (event: MessageEvent) => {
      if (event.data?.kind !== 'jacketee-push') return
      window.dispatchEvent(new Event('jacketee-notifications-updated'))
      toast('New Jacketee alert', { description: event.data.body || 'Open Notifications to view details.' })
    }
    refresh()
    document.addEventListener('visibilitychange', refresh)
    navigator.serviceWorker.addEventListener('message', receive)
    return () => { document.removeEventListener('visibilitychange', refresh); navigator.serviceWorker.removeEventListener('message', receive) }
  }, [user?.id, user?.role])
  return null
}
