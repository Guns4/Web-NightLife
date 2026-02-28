/**
 * =====================================================
 * SERVICE WORKER - PWA OFFLINE SUPPORT
 * AfterHoursID - Sovereign Shield & Global Expansion
 * =====================================================
 */

// Cache names
const CACHE_NAME = 'afterhours-v1';
const STATIC_CACHE = 'afterhours-static-v1';
const DYNAMIC_CACHE = 'afterhours-dynamic-v1';
const BOOKINGS_CACHE = 'afterhours-bookings-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// =====================================================
// INSTALL EVENT
// =====================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  self.skipWaiting();
});

// =====================================================
// ACTIVATE EVENT
// =====================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== BOOKINGS_CACHE)
          .map((key) => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  
  self.clients.claim();
});

// =====================================================
// FETCH EVENT - CACHE STRATEGY
// =====================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip API requests (use network first)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Cache strategies based on request type
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  if (url.pathname.includes('/bookings/') || url.pathname.includes('/nightpass/')) {
    event.respondWith(bookingFirst(request));
    return;
  }
  
  // Default: stale while revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// =====================================================
// CACHE STRATEGIES
// =====================================================

/**
 * Cache First - check cache, fallback to network
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network First - try network, fallback to cache
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Stale While Revalidate - return cache immediately, update in background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  
  // Fetch in background
  fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
  }).catch(() => {});
  
  return cached || new Response('Offline', { status: 503 });
}

/**
 * Booking-First - prioritize booking data for offline access
 */
async function bookingFirst(request) {
  const cached = await caches.match(request);
  
  // Return cached immediately if available
  if (cached) {
    // Update in background
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(BOOKINGS_CACHE).then((cache) => {
          cache.put(request, response.clone());
        });
      }
    }).catch(() => {});
    
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(BOOKINGS_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response(JSON.stringify({ error: 'No booking data available offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// =====================================================
// BACKGROUND SYNC
// =====================================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }
});

async function syncBookings() {
  // Get pending bookings from IndexedDB and sync
  console.log('[SW] Syncing bookings...');
}

// =====================================================
// PUSH NOTIFICATIONS
// =====================================================

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'New notification from AfterHoursID',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'AfterHoursID', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
