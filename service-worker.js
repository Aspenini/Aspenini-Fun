// service-worker.js

const CACHE_NAME = 'aspenini-fun-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/funky-icon.png',
    // Add more assets to cache here (e.g., game images, scripts, etc.)
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
