// Basic Service Worker for PWA Installability
const CACHE_NAME = 'kbm-timework-v1';

self.addEventListener('install', (event) => {
    console.log('[SW] Installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activated');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Pass-through strategy (Network Only)
    // This ensures we rely on Next.js caching logic and don't break the app
    // But having this fetch handler is required for the "Add to Home Screen" prompt to work
    event.respondWith(fetch(event.request));
});
