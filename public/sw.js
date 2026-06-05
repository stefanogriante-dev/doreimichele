// Install: attiva subito senza aspettare che le vecchie schede si chiudano
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// Activate: prende controllo di tutte le schede aperte immediatamente
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// Fetch: necessario per Chrome Android perché riconosca questa come una vera PWA standalone
// (senza questo handler l'icona sulla home apre una nuova scheda Chrome invece dell'app)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || 'DoReMiChele', {
        body: data.body || '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        data: { url: data.url || '/avvisi' },
      }),
      // Imposta badge sull'icona app (se supportato)
      navigator.setAppBadge ? navigator.setAppBadge(data.badge ?? 1) : Promise.resolve(),
    ])
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/avvisi'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find(c => c.url.includes(url))
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})
