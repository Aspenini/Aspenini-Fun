// service-worker.js

const CACHE_NAME = 'aspenini-fun-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/funky-icon.png',
    '/img/funky-icon-192.png',
    '/img/funky-icon-512.png',
    // Add more assets to cache here (e.g., game images, scripts, etc.)
];

// Install the service worker and cache files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache
