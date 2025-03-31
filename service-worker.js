const CACHE_NAME = 'bengali-voice-order-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/pwa.js',
    '/manifest.json',
    '/public/icon-192x192.png',
    '/public/icon-512x512.png',
    '/public/maskable-icon.png'
];

// Service Worker Install Event
self.addEventListener('install', (event) => {
    // Skip waiting forces a service worker to activate immediately
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app shell resources');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Service Worker Activate Event
self.addEventListener('activate', (event) => {
    console.log('Service worker activated');
    
    // Remove old caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((cacheName) => {
                    return cacheName !== CACHE_NAME;
                }).map((cacheName) => {
                    console.log('Deleting old cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        })
    );
    
    // Tell the active service worker to take control of the page immediately
    self.clients.claim();
});

// Service Worker Fetch Event
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    // Skip requests to API endpoints
    if (event.request.url.includes('/speech-to-text') || 
        event.request.url.includes('/language/translate')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response from cache
                if (response) {
                    return response;
                }
                
                // Clone the request because it's a one-time use stream
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then((response) => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response because it's a one-time use stream
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            // Don't cache API responses or dynamic content
                            if (!event.request.url.includes('api')) {
                                cache.put(event.request, responseToCache);
                            }
                        });
                    
                    return response;
                });
            }).catch((error) => {
                console.error('Fetch error:', error);
                
                // Provide a fallback offline page if main HTML fails to load
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
                
                return new Response('Network error happened', {
                    status: 408,
                    headers: { 'Content-Type': 'text/plain' }
                });
            })
    );
}); 