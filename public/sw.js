const CACHE_NAME = 'sout-al-ahzan-cache-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // A simple pass-through strategy for now, allowing the PWA to be installable.
  // Real offline caching can be expanded later if needed.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
