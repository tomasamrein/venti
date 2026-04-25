const CACHE = 'venti-v1'
const OFFLINE_URL = '/offline'

// Assets to pre-cache
const PRECACHE = [OFFLINE_URL]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  // Only handle GET requests
  if (request.method !== 'GET') return
  // Skip API, Supabase, and chrome-extension requests
  if (
    request.url.includes('/api/') ||
    request.url.includes('supabase.co') ||
    request.url.startsWith('chrome-extension')
  ) return

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses for static assets
        if (response.ok && request.url.includes('/_next/static/')) {
          const clone = response.clone()
          caches.open(CACHE).then(cache => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request).then(cached => cached ?? caches.match(OFFLINE_URL)))
  )
})

// Handle push notifications
self.addEventListener('push', event => {
  if (!event.data) return
  let data = { title: 'Venti', body: '' }
  try { data = event.data.json() } catch { data.body = event.data.text() }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'venti-push',
      renotify: true,
      data: data.data ?? {},
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const existingClient = clientList.find(c => c.url.includes(self.location.origin))
      if (existingClient) return existingClient.focus()
      return clients.openWindow('/')
    })
  )
})
