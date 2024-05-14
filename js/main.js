window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./sw.js');
  }
}


  // -----------------------------------------------------------
  // Constants
  // -----------------------------------------------------------
  const DEFAULT_DATA = [
    { id: 1,
      name: 'default',
      config: {},
      timers: [
        {id: 1, duration: 1, date: null},
        {id: 2, duration: 1, date: null},
        {id: 3, duration: 1, date: null},
        {id: 4, duration: 1, date: null}
      ]
    },
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
        console.log(request.result)
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
        resolve(request.result);
      }
    });
  }

  const createTimerHTML = function (item) {
    var color = 'alert-secondary'

    return `
      <button id="countdown-${item.id}"
              class="alert alert-secondary w-100 rounded" role="alert">
        <div class="d-flex justify-content-between w-100 pr-5"> <!-- rounded -->
          <div class="p-2 bd-highlight">
            <h3 class="mb-0 fw-bold"> ${item.id} </h3>
          </div>
          <div class="p-2 bd-highlight">
            <h3 id='countdown-${item.id}-message' mclass="mb-0 fw-bold"> </h3>
          </div>
          <div class="p-2 flex-grow-1 bd-highlight">
            <div class="countdown text-end">
              <span id="countdown-${item.id}-days" class="d-none">00</span> <span class="d-none">:</span>
              <span id="countdown-${item.id}-hours" class="d-none">00</span> <span class="d-none">:</span>
              <span id="countdown-${item.id}-minutes">00</span> <span>:</span>
              <span id="countdown-${item.id}-seconds">00</span>
            </div>
          </div>
        </div>
      </button>`
  }

  function populateTimers() {
    /**
     *
     **/

    PROFILE.timers.forEach((obj) => {
      // Append HTML to DOM.
      $('#heat-block').append(createTimerHTML(obj))
      // Enable already started countdown.
      if (obj.date != null)
        startCountdownB(obj.id, obj)
      else
        $('#countdown-'+obj.id).on('click', function (e) {
          console.log(obj.id, obj)
          startCountdownB(obj.id, obj)
        })
    })

  }

  function addMinutes(date, minutes) {
      return new Date(date.getTime() + minutes*60000);
  }


   function startCountdownB(id, obj) {


      console.log("Startcountdown...", obj)

      if (obj.date == null)
        obj.date = addMinutes(new Date(), 1).getTime();

      // Get element
      let elm = $('#countdown-' + obj.id)


      // Change color to green
      elm.addClass('alert-success')

      // Show the countdown clock
      //elm.style.display = "flex";
      //elm

      // Get the date and time set by the user
      //countdownDate[id] = addMinutes(new Date(), 1).getTime();

      //countdownDate[obj.id]

      console.log(obj)
      console.log(PROFILE)

      //console.log("Starting countdown...", id)
      //console.log(profile)
      //console.log(profile.timers)
      //console.log(profile.timers[parseInt(id)])
      //profile.timers[parseInt(id)-1].date = countdownDate[id]
      updateProfile(PROFILE)


      // Update the countdown every 1 second
      var interval = setInterval(function() {

        if (obj.date == null) {
          clearInterval(interval)
          return
        }

        // Get the current date and time
        let now = new Date().getTime()

        // Calculate distance
        let distance = obj.date - now;

        // .. note:: We have added a dirty offset of one second because the
        //           second number 59 was being always missed. This is probably
        //           caused because it takes around a second to run the setInterval.

        // Calculate days, hours, minutes and seconds
        let days = Math.floor(distance / (1000 * 60 * 60 * 24));
        let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the result
        document.getElementById("countdown-"+id+"-days").innerHTML = days.toString().padStart(2, '0');
        document.getElementById("countdown-"+id+"-hours").innerHTML = hours.toString().padStart(2, '0');
        document.getElementById("countdown-"+id+"-minutes").innerHTML = minutes.toString().padStart(2, '0');
        document.getElementById("countdown-"+id+"-seconds").innerHTML = seconds.toString().padStart(2, '0');

        if (seconds <= 50) {
          if (elm.hasClass('alert-success')) {
            elm.removeClass('alert-success')
            elm.addClass('alert-warning')
            sound1.play()
          }
        }

        if (seconds <= 30) {
          if (elm.hasClass('alert-warning')) {
            $('#countdown-' + id).removeClass('alert-warning')
            $('#countdown-' + id).addClass('alert-danger')
            sound2.play()
          }
        }

        if (distance < 0) {
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
      }, 100);
    }