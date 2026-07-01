import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Open-Meteo — fresh data preferred
registerRoute(
  ({ url }) => url.origin === 'https://api.open-meteo.com',
  new NetworkFirst({
    cacheName: 'open-meteo',
    networkTimeoutSeconds: 8,
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 3600 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Esri map tiles
registerRoute(
  ({ url }) => url.origin === 'https://server.arcgisonline.com',
  new CacheFirst({
    cacheName: 'esri-tiles',
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 604800 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// OSM tiles
registerRoute(
  ({ url }) => /^https:\/\/[a-c]\.tile\.openstreetmap\.org\//.test(url.href),
  new CacheFirst({
    cacheName: 'osm-tiles',
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 604800 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' })
);
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 31536000 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// ── Push notification handler ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const { title, body, url = '/' } = event.data.json();
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      tag: 'weather-alert',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
      const existing = ws.find((c) => c.url.startsWith(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});

// Skip waiting when prompted by the client
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
