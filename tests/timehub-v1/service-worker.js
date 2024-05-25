var cacheName = 'timerhub';
var filesToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/favicon.ico',
  '/manifest.json',
  '/css/pdx.css',
  '/css/main.css',
  '/css/bootstrap.min.css',
  '/js/bootstrap-5.3.0.min.js',
  '/js/easytimer-1.1.3.min.js',
  '/js/jquery-3.6.0.min.js',
  '/audio/mixkit-clear-announce-tones-2861.wav',
  '/audio/mixkit-happy-bells-notification-937.wav',
  '/audio/mixkit-urgent-simple-tone-loop-2976.wav',
];

/*
  '/css/pdx.css',
  '/css/main.css',
  '/css/bootstrap.min.css',
  '/js/main.js',
  '/js/dexie-3.2.4.min.js',
  '/js/easytimer-1.1.3.min.js',
  '/js/jquery-3.6.0.min.js',
  '/js/moment-2.29.1.min.js',
  '/main.js',
  //'/js/pagecycle.js',
  '/audio/mixkit-clear-announce-tones-2861.wav',
  '/images/logo-pdx.svg',
  '/images/logo-pdx.png'
 */


self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      } else {
        return fetch(event.request).then(function(res) {
          return caches.open('dynamic').then(function(cache) {
            cache.put(event.request.url, res.clone());
            return res;
          });
        });
      }
    })
  );
});

/*
self.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        console.log('APP resumed');
        //window.location.reload();
      updateLog('resumedd!')
    }
});*/