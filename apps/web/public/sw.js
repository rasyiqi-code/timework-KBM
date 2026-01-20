const CACHE_NAME = 'timework-lite-pwa-v1';

// Minimal Service Worker to satisfy PWA requirements
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Pass-through strategy: No caching, just fetch from network.
    // This ensures 0% risk of stale data or cache conflicts.
    event.respondWith(fetch(event.request));
});
