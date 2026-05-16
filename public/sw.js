const STATIC_CACHE = 'venti-static-v3'
const DYNAMIC_CACHE = 'venti-dynamic-v3'
const IMAGE_CACHE = 'venti-images-v3'
const FONT_CACHE = 'venti-fonts-v3'
const OFFLINE_URL = '/offline'

const PRECACHE = [OFFLINE_URL]

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

// ── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const CURRENT_CACHES = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, FONT_CACHE]
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !CURRENT_CACHES.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// ── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return
  if (url.protocol === 'chrome-extension:') return

  // Skip: API calls and Supabase (always fresh)
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) return

  // Skip: manifest y service worker (siempre frescos, evita servir HTML cacheado)
  if (url.pathname === '/manifest.json' || url.pathname === '/sw.js') return

  // Fonts: Cache-First (1 year)
  if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com') {
    event.respondWith(cacheFirst(request, FONT_CACHE, 60 * 60 * 24 * 365))
    return
  }

  // Next.js static chunks: Cache-First (30 days, hashed filenames)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, 60 * 60 * 24 * 30))
    return
  }

  // Images: Cache-First (7 days)
  if (url.pathname.startsWith('/_next/image') || /\.(png|jpg|jpeg|webp|svg|gif|ico)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, 60 * 60 * 24 * 7))
    return
  }

  // App pages: Stale-While-Revalidate (serve cached, update in background)
  if (url.hostname === self.location.hostname) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE))
    return
  }
})

// ── Cache strategies ───────────────────────────────────────────────────────
async function cacheFirst(request, cacheName, maxAgeSeconds) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  if (cached) {
    const fetchedAt = cached.headers.get('sw-fetched-at')
    if (fetchedAt && Date.now() - Number(fetchedAt) < maxAgeSeconds * 1000) {
      return cached
    }
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      const clone = response.clone()
      const headers = new Headers(clone.headers)
      headers.set('sw-fetched-at', String(Date.now()))
      const body = await clone.arrayBuffer()
      cache.put(request, new Response(body, { status: clone.status, headers }))
    }
    return response
  } catch {
    return cached ?? caches.match(OFFLINE_URL)
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => null)

  return cached ?? fetchPromise ?? caches.match(OFFLINE_URL)
}

// ── Push notifications ─────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
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

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => c.url.includes(self.location.origin))
      if (existing) return existing.focus()
      return clients.openWindow('/')
    })
  )
})
