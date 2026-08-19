const CACHE = 'launchpad-v5';
const STATIC = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/LaunchPad.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC))
    // Do NOT skipWaiting here — user confirms via in-app Update button
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event?.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never intercept /api/ requests
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Pass through cross-origin requests directly without SW caching/HTML fallback
  if (url.origin !== self.location.origin) {
    return;
  }

  if (e.request.mode === 'navigate' || e.request.destination === 'document' || url.pathname === '/') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(e.request, { cache: 'no-store' });
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE);
          cache.put(e.request, fresh.clone());
        }
        return fresh;
      } catch {
        const cached = await caches.match(e.request);
        return cached || caches.match('/') || Response.error();
      }
    })());
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp.ok && e.request.method === 'GET') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      });
    })
  );
});
