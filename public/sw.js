const CACHE_NAME = 'exam-breaker-v2';
const BASE_PATH = '/Exam-Breaker-2';
const urlsToCache = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/manifest.json',
];

// Install event: Cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.log('Cache addAll error:', err);
        // Don't fail installation if cache fails
        return Promise.resolve();
      });
    })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Helper to check if URL should be cached (skip non-http schemes)
function shouldCache(request) {
  const url = new URL(request.url);
  // Only cache http and https requests
  return url.protocol === 'http:' || url.protocol === 'https:';
}

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip non-http(s) schemes (e.g., chrome-extension://)
  if (!shouldCache(event.request)) {
    return;
  }

  // For navigation requests (page loads), use network first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fall back to cached version when offline
          return caches.match(event.request).then((response) => {
            return response || caches.match(BASE_PATH + '/index.html').then((fallback) => {
              return fallback || new Response('Offline - cached version not available', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
          });
        })
    );
    return;
  }

  // For all other requests (assets, API calls, etc), use cache first with network fallback
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if available
      if (response) {
        return response;
      }

      // Otherwise, fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful or non-basic responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return offline page or default response
          // For API requests, return empty array
          if (event.request.url.includes(BASE_PATH + '/api/')) {
            return new Response(JSON.stringify([]), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          // For other requests, return cached version if available
          return caches.match(BASE_PATH + '/index.html').then((response) => {
            return response || new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        });
    })
  );
});

// Handle messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
