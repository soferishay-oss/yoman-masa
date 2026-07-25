self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A simple fetch handler is required by Chrome to trigger the PWA install prompt.
  // We just let the request pass through.
  event.respondWith(fetch(event.request));
});
