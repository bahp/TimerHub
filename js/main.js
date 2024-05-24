window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./sw.js');
  }
}


  var MESSAGES = {
      labelRemove: "Remove",
      labelIncubating: "Incubating",
      messageIncomplete: "<strong>Caution</strong> Incubation might not be complete.",
      messageReaching: "<strong>Caution</strong> Incubation is almost complete.",
      messagePastTime: "<strong>Caution</strong> Panel incubated significantly past set time. Remove panel from heat block and see IFU."
  }


  // -----------------------------------------------------------
  // Constants
  // -----------------------------------------------------------
  // Sounds
  var sound0 = new Audio('./audio/mixkit-clear-announce-tones-2861.wav')
  var sound1 = new Audio('./audio/mixkit-clear-announce-tones-2861.wav')
  var sound2 = new Audio('./audio/mixkit-happy-bells-notification-937.wav')
  var sound3 = new Audio('./audio/mixkit-urgent-simple-tone-loop-2976.wav')


  /*const DEFAULT_DATA = [
    { id: 1,
      name: 'default',
      config: {},
      timers: [
        {id: 0, duration: 1, date: null, interval: null},
        {id: 1, duration: 1, date: null, interval: null},
        {id: 2, duration: 1, date: null, interval: null},
        {id: 3, duration: 1, date: null, interval: null}
      ]
    },
  ]*/

  // Add for each timer
  //sound_at: {
  //  50: sound1,
  //  30: sound2,
  //  10: sound3
 // }

  const DEFAULT_DATA = [
    { id: 1,
      name: 'default',
      config: {
        text: {
          labels: {
            remove: 'Remove',
            incubating: 'Incubating'
          },
          messages: {
            incomplete: "<strong>Caution</strong> Incubation might not be complete.",
            reaching: "<strong>Caution</strong> Incubation is almost complete.",
            pastTime: "<strong>Caution</strong> Panel incubated significantly past set time. Remove panel from heat block and see IFU."
          }
        },
        periods: {
          sp: 60,   // 60 seconds
          hb: 1*60 // 25 minutes
        }
      },
      timers: {
        0: { name: 0, duration: 10, date: null, interval: null, timer: null},
        1: { name: 1, duration: 10, date: null, interval: null, timer: null},
        2: { name: 2, duration: 10, date: null, interval: null, timer: null},
        3: { name: 3, duration: 10, date: null, interval: null, timer: null},
        4: { name: 4, duration: 10, date: null, interval: null, timer: null}
      }
    }
  ]


  // Variables
  const dbName = "db_timehub";
  const version = 1
  let db;


  // --------------------------------------------------
  //  Helper methods
  // --------------------------------------------------
  function indexedDBSupport(){
    return 'indexedDB' in window;
  }

  async function createDatabase(reset=false) {
     return new Promise(function(resolve, reject) {

         // Not supported show warning
         if (!indexedDBSupport()) {
             $('#warning').removeClass('d-none')
             return
         }

         // Delete (for testing)
         if (reset) {
           var rq = indexedDB.deleteDatabase(dbName)
           rq.onsuccess = function (e) {
             console.log("success");
             e.target.result.close()
           };
           rq.onblocked = function (e) {
             console.log("blocked: " + e);
             // Close connections here
           };
           rq.onerror = function (e) {
             console.log("error: " + e);
           };
         }

         // Open request with name and version.
         // When the database is updated, we can increment the version number and
         // define the onupgradeneeded function to perform the necessary updates
         // to ensure it works as expected.
         // see https://javascript.info/indexeddb
         const request = window.indexedDB.open(dbName, version);

         request.onsuccess = (event) => {
             console.info('Successful database connection!')
             db = request.result;
             resolve(request.result)
         }

         request.onerror = (event) => {
             console.error(`IndexedDB error: ${request.errorCode}`);
         };

         request.onupgradeneeded = (event) => {
             console.info('Database created!');

             // Get database
             const db = request.result;

             // Create an objectStore to hold information about our customers. We
             // could use "initials" as our key path only if it's guaranteed to be
             // unique.
             const objectStore = db.createObjectStore("profiles",
                 {autoIncrement: true, keyPath: 'id'});

             // Create an index to search customers by initials. Since we may have
             // duplicates so we can't use a unique index.
             objectStore.createIndex("profile", "profile", {unique: false});

             // Create an index to search customers by email. We want to ensure
             // that no two customers have the same email, so use a unique index.
             //objectStore.createIndex("email", "email", { unique: true });

             // Create artificial patients
             objectStore.transaction.oncomplete = (event) => {

                 // Store values in the newly created objectStore.
                 const profileObjectStore = db
                     .transaction("profiles", "readwrite")
                     .objectStore("profiles");

                 DEFAULT_DATA.forEach((profile) => {
                     profileObjectStore.add(profile);
                 });

                 console.log('Adding default profile!');
             }

             // Transaction completed
             objectStore.transaction.oncompleted = (e) => {
                 console.log('Object store "profile" created');
             }
         };
     });
  }

  async function getProfile(key){
    /** Get specific profile */
    return new Promise(function(resolve, reject){
      let request = db
        .transaction('profiles')
        .objectStore('profiles')
        .get(key);
      request.onsuccess = function(){
        console.log("getProfile...", request.result)
        resolve(request.result);
      }
    });
  };

  async function getAllProfiles(){
    /** Retrieve all profiles **/
    return new Promise(function(resolve, reject){
      let request = db
        .transaction('profiles')
        .objectStore('profiles')
        .getAll();
      request.onsuccess = function(){
        console.log("getAllProfiles...", request.result)
        resolve(request.result);
      }
    });
  }

  async function updateProfile(p) {
    /** Updates a profile and adds it if doesnt exist **/
    return new Promise(function(resolve, reject){
      console.log("Updating profile in db...", p)
      let request = db
        .transaction('profiles', 'readwrite')
        .objectStore('profiles')
        .put(p)
      request.onsuccess = function(){
        console.log("updateProfile...", request.result)
        resolve(request.result);
      }
    });
  }


  function getColor(item) {
    if (item.date == null)
      return 'alert-secondary'
    // Get the current date and time
    let now = new Date().getTime()
    // Get the difference
    d = diff(now, item.date)
    // Get color
    if (d.seconds > 50)
      return 'alert-green'
    else if ((d.seconds <= 50) & (d.seconds > 30))
      return 'alert-warning'
    else
      return 'alert-danger'
  }

  const createTimerHTML = function (id, item) {
    /**
     *
     **/
    // Get style configuration from time
    d = diff(new Date().getTime(), item.date)
    var days = (d.hours || '00').toString().padStart(2, '0')
    var hours = (d.days || '00').toString().padStart(2, '0')
    var min = (d.minutes || '00').toString().padStart(2, '0')
    var sec = (d.seconds || '00').toString().padStart(2, '0')
    var color = getColor(item)

    // Return
    return `
      <button id="countdown-${id}"
              class="alert ${color} w-100 rounded" role="alert">
        <div class="d-flex justify-content-between w-100 pr-5"> <!-- rounded -->
          <div class="p-2 bd-highlight">
            <h3 class="mb-0 fw-bold"> ${id} </h3>
          </div>
          <div class="p-2 bd-highlight">
            <h3 id='countdown-${id}-message' mclass="mb-0 fw-bold"> </h3>
            <!--<a id="countdown-${id}-removed" class="">Removed</a>-->
          </div>
          <div class="p-2 flex-grow-1 bd-highlight">
            <div class="countdown text-end">
              <span id="countdown-${id}-days" class="d-none"> ${days} </span> <span class="d-none">:</span>
              <span id="countdown-${id}-hours" class="d-none">${hours} </span> <span class="d-none">:</span>
              <span id="countdown-${id}-minutes">${min}</span> <span>:</span>
              <span id="countdown-${id}-seconds">${sec}</span>
            </div>
          </div>
        </div>
      </button>`
  }

  function populateTimers() {
    /**
     * This function dynamically creates the timers.
     *
     * .. note: It requires the variable PROFILE. This
     *          variable contains one profile from the
     *          DEFAULT_DATA.
     *
     *   { id: 1,
     *     name: 'default',
     *     config: {},
     *     timers: {
     *       0: { id: 0, duration: 1, date: null, interval: null},
     *       1: { id: 1, duration: 2, date: null, interval: null},
     *       2: { id: 2, duration: 1, date: null, interval: null},
     *       3: { id: 3, duration: 1, date: null, interval: null}
     *     }
     *   }
     **/

    $.each(PROFILE.timers,function(key, obj){
      // Add timers to DOM.
      $('#heat-block').append(createTimerHTML(key, obj))
      // Enable click to start the timer.
      $('#countdown-' + key).on('click', function (e) {
        if (obj.interval == null)
          startCountdownB(key, obj)
      })
      // Enable timer already running.
      if (obj.date != null)
        startCountdownB(key, obj)
    });


    /*
    PROFILE.timers.forEach((obj) => {
      // Append HTML to DOM.
      $('#heat-block').append(createTimerHTML(obj))
      // Enable click on timer to start
      $('#countdown-'+obj.id).on('click', function (e) {
        console.log(obj)
        if (obj.interval == null)
          startCountdownB(obj.id, obj)
      })
      // Enable already started timer.
      if (obj.date != null)
        startCountdownB(obj.id, obj)

    })*/

  }

  function addMinutes(date, minutes) {
      return new Date(date.getTime() + minutes*60000);
  }


  function diff(d1, d2) {
    /**
     *
     * @type {number}
     */
    if ((d1==null) || (d2==null))
      return {
      'days': null,
      'hours': null,
      'minutes': null,
      'seconds': null
    }
    // Calculate distance
    let distance = d2 - d1;
    return {
      'days': Math.floor(distance / (1000 * 60 * 60 * 24)),
      'hours': Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      'minutes': Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      'seconds': Math.floor((distance % (1000 * 60)) / 1000)
    }
  }

  function startCountdownB(id, obj) {
    /**
     *
     */

    //console.log("Startcountdown...", obj)

    if (obj.date == null) {
      obj.date = addMinutes(new Date(), obj.duration).getTime();
    }

    // Get element
    let elm = $('#countdown-' + id)


    // Change color to green
    elm.addClass('alert-success')

    // Show the countdown clock
    //elm.style.display = "flex";


    updateProfile(PROFILE)


    // Update the countdown every 1 second
    var interval = setInterval(function() {

      //console.log(obj)
      /*if (obj.date == null) {
        console.log("Cleaning interval...", obj)
        clearInterval(interval)
        return
      }*/

      // Get the current date and time
      //let now = new Date().getTime()

      // Calculate distance
      //let distance = obj.date - now;

      // .. note:: We have added a dirty offset of one second because the
      //           second number 59 was being always missed. This is probably
      //           caused because it takes around a second to run the setInterval.

      // Calculate days, hours, minutes and seconds
      //let days = Math.floor(distance / (1000 * 60 * 60 * 24));
      //let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      //let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      //let seconds = Math.floor((distance % (1000 * 60)) / 1000);

       // Get the current date and time
      let now = new Date().getTime()

     // Calculate distance
      //slet distance = obj.date - now;

      d = diff(now, obj.date)

      //console.log(d)

      // Display the result
      $("#countdown-"+id+"-days").html(d.days.toString().padStart(2, '0'));
      $("#countdown-"+id+"-hours").html(d.hours.toString().padStart(2, '0'));
      $("#countdown-"+id+"-minutes").html(d.minutes.toString().padStart(2, '0'));
      $("#countdown-"+id+"-seconds").html(d.seconds.toString().padStart(2, '0'));

      if (d.seconds <= 50) {
        if (elm.hasClass('alert-success')) {
          elm.removeClass('alert-success')
          elm.addClass('alert-warning')
          sound1.play()
        }
      }

      if (d.seconds <= 30) {
        if (elm.hasClass('alert-warning')) {
          $('#countdown-' + id).removeClass('alert-warning')
          $('#countdown-' + id).addClass('alert-danger')
          sound2.play()
        }
      }

      if (d.distance < 0) {
        if (!elm.hasClass('expired')) {
          $('#countdown-' + id).addClass('expired')
          $('#countdown-' + id + '-message').text('Remove')
          sound3.play()
        }
      }

      /*
      // If the countdown is over, display a message
      if (distance < 50*1000) {
        console.log("Change!")
        if ($('#countdown-'+id).hasClass('alert-red')) {
          $('#countdown-' + id).removeClass('alert-red')
          $('#countdown-' + id).addClass('alert-green')
        }
        //clearInterval(x);
        document.getElementById("countdown").innerHTML = "EXPIRED";
      }*/
    }, 200);


      PROFILE.timers[id].interval = interval
  }

  $('.timer-btn-removed').on('click', function (e) {
     /**
      * All the required actions to reset a timer.
      *
      */
      // Get the id
      let id = parseInt($(this).attr('value'))
      console.log($(this).attr('value'))
      console.log(PROFILE.timers[id])

      // Stop the timer
      clearInterval(PROFILE.timers[id].interval)
      PROFILE.timers[id].date = null
      PROFILE.timers[id].interval = null
      updateProfile(PROFILE)

      // Reset the style to default timer
      var obj = $('#countdown-' + id)
      obj.removeClass('alert-danger')
      obj.removeClass('alert-warning')
      obj.removeClass('alert-success')
      obj.addClass('alert-secondary')

      // Reset message and set the counter to zero.
      $('#countdown-' + id + '-message').html('')
      $('#countdown-' + id + '-minutes').html('00')
      $('#countdown-' + id + '-seconds').html('00')
   })


  $('#countdown-1-removed').attr('value')


  function test() {
    getProfile('default').then(function(result) {
      console.log("Retrieved:", result)
    })
    getProfile(0).then(function(result) {
      console.log("Retrieved:", result)
    })
    getProfile(1).then(function(result) {
      console.log("Retrieved:", result)
    })
    getAllProfiles().then(function(result) {
      console.log("Retrieved:", result)
    })
  }


  function getSecondsFromNow(d) {
    return moment().diff(moment(d), 'seconds')
  }

  function run(id) {
    var d = 1715713158263
    PROFILE.timers[id].date = d
    var t = setTimer(id, PROFILE.timers[0])
  }

  function setTimer(id, obj) {
    /**
     *
     */
    // Get seconds from start
    var s = getSecondsFromNow(obj.date)

    // Create timer and start
    timer = new Timer()
    timer.start({
      precision: 'seconds',
      startValues: {seconds: s},
      //target: {seconds: 10000}
    });

    // Handle events
    timer.addEventListener('secondsUpdated', function (e) {
      console.log(timer.getTimeValues().toString())
      $('#countdown-15-timer').html(timer.getTimeValues().toString())
    });

    return timer
  }