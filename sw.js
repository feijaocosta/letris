const CACHE_NAME = 'letris-v1.0.0';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      // Try to cache assets, but don't fail if some are missing
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => 
          cache.add(url).catch(err => {
            console.warn(`[SW] Failed to cache ${url}:`, err);
            return null;
          })
        )
      );
    }).catch((error) => {
      console.error('[SW] Failed to open cache:', error);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests, chrome-extension requests, and development URLs
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://') ||
      event.request.url.includes('figma.site') ||
      event.request.url.includes('localhost:')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if available
      if (response) {
        return response;
      }

      // Fetch from network
      return fetch(event.request).then((fetchResponse) => {
        // Don't cache non-ok responses or non-basic responses
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }

        // Clone the response for caching
        const responseToCache = fetchResponse.clone();

        // Cache the response asynchronously
        caches.open(CACHE_NAME).then((cache) => {
          // Only cache GET requests for same origin
          if (event.request.url.startsWith(self.location.origin)) {
            cache.put(event.request, responseToCache).catch(err => {
              console.warn('[SW] Failed to cache:', event.request.url, err);
            });
          }
        }).catch(err => {
          console.warn('[SW] Failed to open cache for:', event.request.url, err);
        });

        return fetchResponse;
      });
    }).catch(() => {
      // If both cache and network fail, try to return a fallback
      if (event.request.destination === 'document') {
        return new Response(
          `<!DOCTYPE html>
          <html>
          <head>
            <title>LETRIS - Offline</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .offline { color: #666; }
            </style>
          </head>
          <body>
            <h1>🎮 LETRIS</h1>
            <p class="offline">Você está offline. Verifique sua conexão e tente novamente.</p>
          </body>
          </html>`,
          { headers: { 'Content-Type': 'text/html' } }
        );
      }
      
      // For other requests, just fail
      return new Response('Offline', { status: 503 });
    })
  );
});

// Background sync for when user comes back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    // Handle background tasks when online
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received.');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});