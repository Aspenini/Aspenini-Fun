
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('fun-hub-cache').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/style.css',
        '/manifest.json',
        '/game2/index.html',
        '/game3/index.html',
        '/img/tetris_logo.jpg',
        '/img/LegacyKevinKlicker.png',
        '/img/app-icon-192x192.png',
        '/img/app-icon-512x512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
