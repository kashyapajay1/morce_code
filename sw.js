// Morse Academy — Service Worker
const CACHE_NAME = 'morse-academy-v1';
const APP_SHELL = [
    './',
    './index.html',
    './css/main.css',
    './css/components.css',
    './css/animations.css',
    './js/app.js',
    './js/router.js',
    './js/state.js',
    './js/api.js',
    './js/theme.js',
    './js/audio.js',
    './js/morse-engine.js',
    './js/components/navigation.js',
    './js/components/toast.js',
    './js/components/modal.js',
    './js/components/progress-bar.js',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Network-first for API calls, cache-first for app shell
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
    } else {
        event.respondWith(
            caches.match(event.request).then((cached) => cached || fetch(event.request))
        );
    }
});
