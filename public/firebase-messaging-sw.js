// FCM data-only messages use the standard Push API. No CDN imports or secrets.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let payload
    try { payload = event.data.json() } catch { return }
    const data = payload.data || {}
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const visible = windows.filter(client => client.visibilityState === 'visible' && new URL(client.url).pathname.startsWith('/admin'))
    if (visible.length) {
      visible.forEach(client => client.postMessage({ kind: 'jacketee-push', body: data.body }))
    }
    await self.registration.showNotification(data.title || 'Jacketee Admin', {
      body: data.body || 'You have a new admin notification.', icon: '/push-icon-192.png',
      tag: data.id || 'jacketee-admin', data: { url: data.url || '/admin/notifications' },
    })
  })())
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil((async () => {
    let target = new URL('/admin/notifications', self.location.origin)
    try {
      const proposed = new URL(event.notification.data?.url, self.location.origin)
      if (proposed.origin === self.location.origin && proposed.pathname.startsWith('/admin/')) target = proposed
    } catch {}
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if (new URL(client.url).origin === target.origin) {
        await client.navigate(target.href); await client.focus(); return
      }
    }
    await self.clients.openWindow(target.href)
  })())
})
