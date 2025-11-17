window.adminDashboard = function adminDashboard() {
    return {
        loading: true,
        error: '',
        allUsers: [],
        settings: null,
        isLocked: false,
        lockTimeFormatted: '',
        isProcessing: false,
        showConfirmation: false,
        pairingResult: null,
        unsubscribeUsers: null,
        unsubscribeSettings: null,

        async init() {
            // Wait for Firebase to be initialized
            const waitForFirebase = setInterval(() => {
                if (window.firebaseAuth && window.firebaseFirestore) {
                    clearInterval(waitForFirebase);
                    this.initializeDashboard();
                }
            }, 50);
        },

        async initializeDashboard() {
            try {
                // Set up real-time listener for all non-admin users
                this.unsubscribeUsers = window.firebaseFirestore
                    .collection('users')
                    .where('isAdmin', '!=', true)
                    .onSnapshot(
                        (snapshot) => {
                            this.allUsers = [];
                            snapshot.forEach((doc) => {
                                this.allUsers.push({ id: doc.id, ...doc.data() });
                            });
                        },
                        (error) => {
                            this.error = 'Failed to load users';
                        }
                    );

                // Set up real-time listener for settings
                this.unsubscribeSettings = window.firebaseFirestore
                    .collection('settings')
                    .doc('config')
                    .onSnapshot(
                        (doc) => {
                            if (doc.exists) {
                                this.settings = doc.data();
                                this.isLocked = !!this.settings.lockInTime;

                                if (this.settings.lockInTime) {
                                    const lockDate = this.settings.lockInTime.toDate();
                                    this.lockTimeFormatted = `(${lockDate.toLocaleString('en-IE')})`;
                                }
                            } else {
                                this.settings = { lockInTime: null };
                                this.isLocked = false;
                            }
                            this.loading = false;
                        },
                        (error) => {
                            this.error = 'Failed to load settings';
                            this.loading = false;
                        }
                    );
            } catch (error) {
                this.error = 'Failed to initialize admin dashboard';
                this.loading = false;
            }
        },

        async triggerPairing() {
            this.isProcessing = true;
            this.pairingResult = null;
            this.showConfirmation = false;

            try {
                // Call Cloud Function to perform pairing
                const pairFunction = window.firebaseFunctions.httpsCallable('triggerSecretSantaPairing');
                const result = await pairFunction();

                this.pairingResult = {
                    success: true,
                    message: `Pairing successful! ${result.data.pairingsCount} users paired.`
                };
            } catch (error) {

                let errorMessage = 'Failed to trigger pairing';
                if (error.code === 'permission-denied') {
                    errorMessage = 'Permission denied. Admin access required.';
                } else if (error.message) {
                    errorMessage = error.message;
                }

                this.pairingResult = {
                    success: false,
                    message: errorMessage
                };
            } finally {
                this.isProcessing = false;
            }
        },

        destroy() {
            // Clean up listeners
            if (this.unsubscribeUsers) {
                this.unsubscribeUsers();
            }
            if (this.unsubscribeSettings) {
                this.unsubscribeSettings();
            }
        }
    };
};
