/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

self.addEventListener('push', (event) => {
  if (!event.data) return
  let data: { title?: string; body?: string; data?: Record<string, unknown> } = {}
  try { data = event.data.json() } catch { data.body = event.data.text() }

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Venti', {
      body: data.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'venti-push',
      renotify: true,
      data: data.data ?? {},
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => c.url.includes(self.location.origin))
      if (existing) return existing.focus()
      return self.clients.openWindow('/')
    })
  )
})
