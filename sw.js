/* Service worker "LaCarte Caisse" — mise en cache pour usage hors-ligne.
   Les données (ventes, stock, historique) restent dans IndexedDB, sur l'appareil ;
   ce fichier ne fait que mettre en cache le code de l'application (HTML/manifest/icônes)
   pour qu'elle s'ouvre même sans connexion internet. */
const CACHE_NAME = 'lacarte-caisse-v1';
const APP_SHELL = [
  './lacarte-caisse.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(()=>{})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Stratégie "cache d'abord, réseau en secours" : l'app s'ouvre instantanément,
   même hors-ligne, et se met à jour discrètement quand le réseau est là. */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
