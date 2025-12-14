(function () {
    const checkFirebase = setInterval(() => {
        if (typeof firebase !== 'undefined' && window.RuntimeConfig && window.RuntimeConfig.FIREBASE_CONFIG) {
            clearInterval(checkFirebase);

            // Initialize app from runtime config if not already
            if (firebase.apps && firebase.apps.length === 0) {
                firebase.initializeApp(window.RuntimeConfig.FIREBASE_CONFIG);
            }

            const auth = firebase.auth();
            const firestore = firebase.firestore();
            const functions = firebase.functions();
            const storage = firebase.storage();

            const useEmu = window.RuntimeConfig.USE_EMULATORS === true ||
                (location.hostname === 'localhost' || location.hostname === '127.0.0.1');

            if (useEmu) {
                try {
                    auth.useEmulator('http://localhost:9099');
                } catch { }
                try {
                    firestore.useEmulator('localhost', 8080);
                } catch { }
                try {
                    functions.useEmulator('localhost', 5001);
                } catch { }
                try {
                    storage.useEmulator('localhost', 9199);
                } catch { }
            }

            window.firebaseAuth = auth;
            window.firebaseFirestore = firestore;
            window.firebaseFunctions = functions;
            window.firebaseStorage = storage;
        }
    }, 50);
})();