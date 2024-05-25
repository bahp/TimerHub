// --------------------------------------------------
// Variables
// --------------------------------------------------
const dbName = "db_timehub";
const version = 1
let db;

var sound0 = new Audio('./audio/mixkit-clear-announce-tones-2861.wav')
var sound1 = new Audio('./audio/mixkit-clear-announce-tones-2861.wav')
var sound2 = new Audio('./audio/mixkit-happy-bells-notification-937.wav')
var sound3 = new Audio('./audio/mixkit-urgent-simple-tone-loop-2976.wav')

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


// --------------------------------------------------
// Helper methods
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