'use client'

import { startTransition, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { browserMessaging, isFirebaseClientConfigured, registerPushDevice } from '@/lib/firebase-client'
import { pushRequest, withPushTimeout } from '@/lib/push-registration'
import { Loader2 } from 'lucide-react'

export function PushNotificationSettings() {
  const { data: session, status } = useSession()
  const userId = (session?.user as { id?: string })?.id
  const [configured, setConfigured] = useState(false)
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(true)
  const [message, setMessage] = useState('Checking notification settings…')
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    if (status === 'loading') return
    let active = true
    const controller = new AbortController()
    startTransition(() => {
      setBusy(true)
      setToken('')
      setMessage('Checking notification settings…')
    })
    ;(async () => {
      try {
        if (!userId) throw new Error('Please sign in again to manage notifications.')
        const data = await pushRequest('GET', undefined, controller.signal)
        const browserConfigured = isFirebaseClientConfigured()
        const ready = data.configured && browserConfigured
        if (!active) return
        setConfigured(ready)
        if (!ready) {
          setMessage(data.configured && !browserConfigured
            ? 'Firebase browser settings are missing. Restart the local server, or rebuild and redeploy after saving the public Firebase environment settings.'
            : 'Push notifications will be available after Firebase setup is complete.')
          return
        }
        if (!window.isSecureContext) { setMessage('Notifications require HTTPS or http://localhost. Open the local site using localhost, not a plain HTTP network IP.'); return }
        if (!('Notification' in window) || !('serviceWorker' in navigator)) { setMessage('Push is unavailable. On iPhone, open Jacketee from your Home Screen.'); return }
        if (Notification.permission === 'granted' && localStorage.getItem('jacketee-push-user') === userId) {
          const value = await registerPushDevice(value => { if (active) setMessage(value) })
          if (active) { setToken(value); setMessage('Notifications are enabled on this device.') }
        } else setMessage(Notification.permission === 'denied' ? 'Notifications are blocked. Allow them in your browser site settings first.' : 'Enable alerts on this device, including when the website is closed.')
      } catch (error) { if (active) setMessage(error instanceof Error ? error.message : 'Unable to check notifications.') }
      finally { if (active) setBusy(false) }
    })()
    return () => { active = false; controller.abort() }
  }, [userId, status, refresh])
  async function action(kind: 'enable' | 'disable' | 'test') {
    setBusy(true)
    try {
      if (kind === 'enable') {
        if (!window.isSecureContext) throw new Error('Notifications require HTTPS or http://localhost. Open the local site using localhost, not a plain HTTP network IP.')
        if (!('Notification' in window)) throw new Error('On iPhone, add Jacketee to your Home Screen and open it there first.')
        setMessage('Waiting for notification permission. Choose Allow in your browser prompt…')
        const permission = Notification.permission === 'granted' ? 'granted' : await withPushTimeout(Notification.requestPermission(), 'No notification permission response was received. Check the browser permission prompt and try again.', 45_000)
        if (permission !== 'granted') throw new Error('Allow notifications in your browser settings to receive alerts.')
        const value = await registerPushDevice(setMessage)
        localStorage.setItem('jacketee-push-user', userId || '')
        setToken(value); setMessage('Notifications are enabled on this device.')
      } else {
        setMessage(kind === 'disable' ? 'Disabling notifications on this device…' : 'Sending a test notification…')
        await pushRequest(kind === 'disable' ? 'DELETE' : 'PATCH', token)
        if (kind === 'disable') {
          localStorage.removeItem('jacketee-push-user'); setToken('')
          const { messaging, sdk } = await withPushTimeout(browserMessaging(), 'Loading notification support took too long.')
          await withPushTimeout(sdk.deleteToken(messaging), 'Server notifications are disabled. Browser registration cleanup timed out; reload before enabling again.')
          setMessage('Notifications are disabled on this device.')
        } else setMessage('Test sent. Check this device’s notifications. If nothing appears, check your browser and phone notification settings.')
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to update notifications.') }
    finally { setBusy(false) }
  }
  return <section className="rounded-xl border bg-background p-4 space-y-3" aria-label="Push notifications">
    <h3 className="font-semibold">Device notifications</h3>
    <p className="text-sm text-muted-foreground flex items-start gap-2" role="status" aria-live="polite">
      {busy && <Loader2 aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin mt-0.5" />}{message}
    </p>
    {configured && <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" disabled={busy} onClick={() => action('enable')}>{busy ? 'Please wait…' : token ? 'Refresh registration' : 'Enable notifications'}</Button>
      {token && <><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => action('test')}>Send test</Button><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => action('disable')}>Disable on this device</Button></>}
    </div>}
    {!busy && <Button type="button" size="sm" variant="ghost" onClick={() => setRefresh(value => value + 1)}>Check settings again</Button>}
  </section>
}
