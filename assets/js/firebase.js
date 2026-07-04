(function () {
  const FIREBASE_SDK_VERSION = '10.12.5';
  const FIRESTORE_WRITE_TIMEOUT_MS = 15000;

  /**
   * Replace every empty string below with your Firebase web app credentials.
   * Keep the object name as `firebaseConfig`; the rest of this file can stay as-is.
   */
  const firebaseConfig = {
    apiKey: "AIzaSyDBfhWZVs1rdEYvhdT3SW8-C94G6Ofbp_A",
    authDomain: "yoga-template-32612.firebaseapp.com",
    projectId: "yoga-template-32612",
    storageBucket: "yoga-template-32612.firebasestorage.app",
    messagingSenderId: "653886945209",
    appId: "1:653886945209:web:32a765f9b0e480a2192868"
  };

  let firestoreDatabase = null;
  let firestoreModules = null;

  function hasFirebaseConfig() {
    return Object.values(firebaseConfig).every((value) => typeof value === 'string' && value.trim() !== '');
  }

  async function loadFirebaseModules() {
    if (!firestoreModules) {
      try {
        const firebaseAppModule = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`);
        const firestoreModule = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore-lite.js`);

        firestoreModules = {
          initializeApp: firebaseAppModule.initializeApp,
          getFirestore: firestoreModule.getFirestore,
          collection: firestoreModule.collection,
          addDoc: firestoreModule.addDoc,
        };
      } catch (error) {
        throw new Error('Firebase SDK could not be loaded. Check your internet connection and make sure gstatic.com is not blocked.');
      }
    }

    return firestoreModules;
  }

  function withTimeout(promise, timeoutMs, timeoutMessage) {
    let timeoutId;

    const timeout = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);
    });

    return Promise.race([promise, timeout]).finally(() => {
      window.clearTimeout(timeoutId);
    });
  }

  function getRegistrationErrorMessage(error) {
    const code = error && error.code ? error.code : '';

    if (code === 'permission-denied') {
      return 'Firestore rejected the write. Allow unauthenticated creates for the registrations collection while testing, or add an auth flow before production.';
    }

    if (code === 'not-found' || code === 'failed-precondition') {
      return 'Firestore is not ready for this project. Create the Firestore database in Firebase Console, then try again.';
    }

    return error && error.message ? error.message : 'Registration could not be saved.';
  }

  async function getDatabase() {
    if (!hasFirebaseConfig()) {
      throw new Error('Firebase is not configured yet. Add your project keys in assets/js/firebase.js.');
    }

    const { initializeApp, getFirestore } = await loadFirebaseModules();

    if (!firestoreDatabase) {
      const app = initializeApp(firebaseConfig);
      firestoreDatabase = getFirestore(app);
    }

    return firestoreDatabase;
  }

  /**
   * Writes one registration document to Firestore.
   * The field names intentionally match the required backend/Firebase contract.
   */
  async function saveRegistration(registrationData) {
    const database = await getDatabase();
    const { collection, addDoc } = await loadFirebaseModules();
    const registrationsCollection = collection(database, 'registrations');
    const documentReference = await withTimeout(
      addDoc(registrationsCollection, registrationData),
      FIRESTORE_WRITE_TIMEOUT_MS,
      'Registration is taking too long to save. Check your Firestore rules, database setup, and network connection.'
    );

    return documentReference.id;
  }

  window.FirebaseRegistration = {
    saveRegistration,
    getRegistrationErrorMessage,
  };
}());
