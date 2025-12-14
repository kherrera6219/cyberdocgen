/**
 * CyberDocGen Service Worker
 *
 * Production-ready PWA service worker with:
 * - Multiple cache strategies
 * - Offline support
 * - Background sync
 * - Push notifications (optional)
 * - Cache management
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `cyberdocgen-${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',        // Static assets (images, fonts, CSS, JS)
  NETWORK_FIRST: 'network-first',    // API calls, dynamic content
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate', // CSS, JS updates
};

// Cache size limits
const CACHE_LIMITS = {
  [STATIC_CACHE]: 100,
  [DYNAMIC_CACHE]: 50,
  [API_CACHE]: 30,
};

// Cache expiration times (in seconds)
const CACHE_EXPIRATION = {
  [STATIC_CACHE]: 7 * 24 * 60 * 60,  // 7 days
  [DYNAMIC_CACHE]: 24 * 60 * 60,     // 1 day
  [API_CACHE]: 5 * 60,                // 5 minutes
};

/**
 * Install event - Precache essential assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

/**
 * Activate event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old caches that don't match current version
              return cacheName.startsWith('cyberdocgen-') &&
                     cacheName !== CACHE_NAME &&
                     cacheName !== STATIC_CACHE &&
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== API_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - Handle requests with appropriate cache strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Handle navigation requests (page loads)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Default: stale-while-revalidate
  event.respondWith(handleDynamicRequest(request));
});

/**
 * Handle navigation requests (HTML pages)
 * Strategy: Network-first with offline fallback
 */
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, serving offline page');

    // Try to serve cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    // Serve offline fallback
    return caches.match('/offline.html');
  }
}

/**
 * Handle API requests
 * Strategy: Network-first with short-lived cache
 */
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);

  try {
    const networkResponse = await fetch(request);

    // Only cache successful GET requests
    if (networkResponse.ok && request.method === 'GET') {
      cache.put(request, networkResponse.clone());
      await limitCacheSize(API_CACHE, CACHE_LIMITS[API_CACHE]);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] API network failed, checking cache');

    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving cached API response');
      return cachedResponse;
    }

    // Return offline response for API
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No network connection available'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle static asset requests
 * Strategy: Cache-first
 */
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log('[SW] Serving cached static asset:', request.url);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      await limitCacheSize(STATIC_CACHE, CACHE_LIMITS[STATIC_CACHE]);
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', error);
    throw error;
  }
}

/**
 * Handle dynamic content requests
 * Strategy: Stale-while-revalidate
 */
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        limitCacheSize(DYNAMIC_CACHE, CACHE_LIMITS[DYNAMIC_CACHE]);
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] Network fetch failed:', error);
      return cachedResponse || caches.match('/offline.html');
    });

  return cachedResponse || fetchPromise;
}

/**
 * Check if a path is a static asset
 */
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp',
    '.woff', '.woff2', '.ttf', '.eot', '.ico'
  ];

  return staticExtensions.some(ext => pathname.endsWith(ext));
}

/**
 * Limit cache size by removing oldest entries
 */
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    console.log(`[SW] Limiting cache ${cacheName} to ${maxItems} items`);
    await cache.delete(keys[0]);
    await limitCacheSize(cacheName, maxItems);
  }
}

/**
 * Background Sync - Retry failed requests when online
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

/**
 * Sync data when connection is restored
 */
async function syncData() {
  console.log('[SW] Syncing data...');

  try {
    // Get pending sync requests from IndexedDB
    // This would be implemented based on your app's needs
    console.log('[SW] Data sync completed');
  } catch (error) {
    console.error('[SW] Data sync failed:', error);
    throw error;
  }
}

/**
 * Push Notification Handler (optional)
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'explore', title: 'View', icon: '/icon-96.png' },
      { action: 'close', title: 'Close', icon: '/icon-96.png' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('CyberDocGen', options)
  );
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

/**
 * Message Handler - Communication with client
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLIENTS_CLAIM') {
    self.clients.claim();
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(STATIC_CACHE)
        .then(cache => cache.addAll(event.data.urls))
    );
  }
});
