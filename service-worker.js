// service-worker.js

const CACHE_NAME = 'aspenini-fun-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/icon/funky-icon.png',
    '/icon/funky-icon-192.png',
    '/icon/funky-icon-512.png',
    
    // Cached games
    '/games/Connect%20the%20Pipes.html',
    '/games/EaglercraftX.html',
    '/games/HTML%20Tower%20Defence.html',
    '/games/Snakegame.html',
    '/games/brick-breaker.html',
    '/games/maze.html',
    '/games/slopeoffline.html',
    '/games/space-invaders.html',
    '/games/tic-tac-toe.html',
    '/games/legacy-kevin-klicker/index.html',
    '/games/legacy-tetris/index.html',
    '/games/roulette/index.html',
    '/games/tetris/index.html',

    // Cached apps
    '/apps/adjustable-fireworks.html',
    '/apps/aim-click-challenge.html',
    '/apps/beepbox_offline.html',
    '/apps/random-password.html',
    '/apps/seeded-procedural-music.html',
    '/apps/text-editor/index.html'
];

// Install the service worker and cache files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch cached content when offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;  // Return the cached file
                }
                return fetch(event.request);  // Fallback to network if not cached
            })
    );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (cacheWhitelist.indexOf(key) === -1) {
                        return caches.delete(key);  // Remove old caches
                    }
                })
            );
        })
    );
});
