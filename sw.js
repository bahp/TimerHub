var cacheName = 'timerhub';
var filesToCache = [
  '/',
  '/index.html',
  '/index-v2.html',
  '/css/style.css',
  '/css/pdx.css',
  '/css/main.css',
  '/css/bootstrap.min.css',
  '/js/main.js',
  '/js/bootstrap-5.3.0.min.js',
  '/js/dexie-3.2.4.min.js',
  '/js/easytimer-1.1.3.min.js',
  '/js/jquery-3.6.0.min.js',
  '/js/moment-2.29.1.min.js',
  '/js/pagecycle.js',
  '/audio/mixkit-clear-announce-tones-2861.wav',
  '/audio/mixkit-happy-bells-notification-937.wav',
  '/audio/mixkit-urgent-simple-tone-loop-2976.wav',
  '/images/logo-pdx.svg',
  '/images/logo-pdx.png'
];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
  self.skipWaiting();
});

/* Serve cached content when offline */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});

self.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        console.log('APP resumed');
        $('#info').html('APP resumed', new Date())
        window.location.reload();
    }
});