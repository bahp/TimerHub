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
  //'/js/pagecycle.js',
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
        //window.location.reload();
      updateLog('resumedd!')
    }
});






  const getState = () => {
    if (document.visibilityState === 'hidden') {
      return 'hidden';
    }
    if (document.hasFocus()) {
      return 'active';
    }
    return 'passive';
  };

  // Stores the initial state using the `getState()` function (defined above).
  let state = getState();

  // Accepts a next state and, if there's been a state change, logs the
  // change to the console. It also updates the `state` value defined above.
  const logStateChange = (nextState) => {
    const prevState = state;
    if (nextState !== prevState) {
      console.log(`State change: ${prevState} >>> ${nextState}`);
      updateLog(`2State change: ${prevState} >>> ${nextState}`)
      //if (nextState == 'active')
      //    location.reload();
    }
  };

  // Options used for all event listeners.
  const opts = {capture: true};

  // These lifecycle events can all use the same listener to observe state
  // changes (they call the `getState()` function to determine the next state).
  ['pageshow', 'focus', 'blur', 'visibilitychange', 'resume'].forEach((type) => {
    window.addEventListener(type, () => logStateChange(getState(), opts));
  });

  // The next two listeners, on the other hand, can determine the next
  // state from the event itself.
  window.addEventListener('freeze', () => {
    // In the freeze event, the next state is always frozen.
    logStateChange('frozen');
  }, opts);

  window.addEventListener('pagehide', (event) => {
    // If the event's persisted property is `true` the page is about
    // to enter the back/forward cache, which is also in the frozen state.
    // If the event's persisted property is not `true` the page is
    // about to be unloaded.
    logStateChange(event.persisted ? 'frozen' : 'terminated');
  }, opts);

  document.addEventListener('resume', (event) => {
    console.log("The page has been resumed!")
    document.getElementById("info").innerHTML =
      document.getElementById("info").innerHTML + new Date() ;
    $('#info').html('Resume', new Date().toString())
  });



