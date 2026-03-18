const CACHE_NAME = 'astrovastu-v1';
const urlsToCache = [
  '.',
  './index.html',
  './static/js/main.js',
  './static/css/main.css',
  './logo192.png',
  './logo512.png',
  './favicon.ico',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests, skip Firebase/API calls
  if (event.request.method !== 'GET') return;
  const url = event.request.url;
  if (url.includes('firestore') || url.includes('firebase') || url.includes('msg91') || url.includes('googleapis')) return;

  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
