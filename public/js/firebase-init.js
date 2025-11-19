(function () {
    const checkFirebase = setInterval(() => {
        if (typeof firebase !== 'undefined') {
            clearInterval(checkFirebase);
            const auth = firebase.auth();
            const firestore = firebase.firestore();
            const functions = firebase.functions();
            const storage = firebase.storage();

            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                auth.useEmulator('http://localhost:9099');
                firestore.useEmulator('localhost', 8080);
                functions.useEmulator('localhost', 5001);
                storage.useEmulator('localhost', 9199);
            }

            window.firebaseAuth = auth;
            window.firebaseFirestore = firestore;
            window.firebaseFunctions = functions;
            window.firebaseStorage = storage;
        }
    }, 50);
})();