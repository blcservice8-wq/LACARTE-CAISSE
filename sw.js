/* Service Worker — LaCarte Caisse (BLC Services)
   Nécessaire pour que Chrome/Android propose l'installation (PWA).
   Stratégie : cache "app shell" + secours hors-ligne. */

const CACHE_NAME = 'lacarte-caisse-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

/* Ce gestionnaire "fetch" est OBLIGATOIRE : Chrome n'affiche l'invite
   d'installation ("Ajouter à l'écran d'accueil") que si un Service Worker
   actif possède un handler fetch qui répond aux requêtes. */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached || caches.match('./index.html'));
      return cached || network;
    })
  );
});
