const CACHE = 'enchantments-v1';
const SHELL = ['/enchantments/manifest.json', '/enchantments/icon-192.png', '/enchantments/icon-512.png'];

const BYPASS = [
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'maps.googleapis.com',
  'maps.gstatic.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

self.addEventListener('install', (e) => {
  // Cache individual assets — don't let one failure abort the whole install
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.allSettled(SHELL.map((url) => c.add(url)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  if (e.request.method !== 'GET') return;
  if (BYPASS.some((h) => url.includes(h))) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).then((res) => {
      if (res.ok && res.type !== 'opaque') {
        caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
      }
      return res;
    }))
  );
});
