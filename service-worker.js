const CACHE_VERSION = 'compras-v12';
const ASSETS = ['./', './index.html', './manual.js', './manifest.webmanifest',
                './fonts/URWGothic-Book.ttf'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(
    ks.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    const copia = r.clone();
    caches.open(CACHE_VERSION).then(c => c.put(e.request, copia)).catch(()=>{});
    return r;
  }).catch(() => caches.match(e.request)));
});
