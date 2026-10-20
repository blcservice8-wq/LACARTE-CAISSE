/* LaCarte Caisse — service worker v3
   - l'application (HTML) est toujours chargée depuis le réseau d'abord : plus de version périmée
   - copie en cache uniquement pour le mode hors ligne
   - SDK Firebase mis en cache : démarrage hors ligne possible
   - Firestore / Auth ne sont jamais interceptés */
const CACHE='lacarte-v3';
const FB=/^https:\/\/www\.gstatic\.com\/firebasejs\//;
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.add(self.registration.scope)).catch(()=>{}));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  if(FB.test(req.url)){
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match(req); if(hit) return hit;
      const res=await fetch(req); try{ c.put(req,res.clone()); }catch(_){} return res;
    }));
    return;
  }
  if(new URL(req.url).origin!==self.location.origin) return;
  e.respondWith(
    fetch(req,{cache:'no-cache'}).then(res=>{
      if(res && res.ok){ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{}); }
      return res;
    }).catch(()=>caches.match(req).then(h=>h||caches.match(self.registration.scope)))
  );
});
