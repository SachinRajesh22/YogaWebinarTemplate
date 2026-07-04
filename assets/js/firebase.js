(function () {
  /**
   * Replace every empty string below with your Firebase web app credentials.
   * Keep the object name as `firebaseConfig`; the rest of this file can stay as-is.
   */
  const firebaseConfig = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  };

  let firestoreDatabase = null;
  let firestoreModules = null;

  function hasFirebaseConfig() {
    return Object.values(firebaseConfig).every((value) => typeof value === 'string' && value.trim() !== '');
  }

  async function loadFirebaseModules() {
    if (!firestoreModules) {
      const firebaseAppModule = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
      const firestoreModule = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');

      firestoreModules = {
        initializeApp: firebaseAppModule.initializeApp,
        getFirestore: firestoreModule.getFirestore,
        collection: firestoreModule.collection,
        addDoc: firestoreModule.addDoc,
      };
    }

    return firestoreModules;
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
    const documentReference = await addDoc(registrationsCollection, registrationData);

    return documentReference.id;
  }

  window.FirebaseRegistration = {
    saveRegistration,
  };
}());
