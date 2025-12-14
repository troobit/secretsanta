window.adminDashboard = function adminDashboard() {
    return {
        loading: true,
        error: '',
        allUsers: [],
        usersById: {},
        isProcessing: false,
        showConfirmation: false,
        pairingResult: null,
        unsubscribeUsers: null,
        conflictActionFeedback: '',

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
                            this.usersById = {};
                            snapshot.forEach((doc) => {
                                const data = { id: doc.id, ...doc.data() };
                                // Normalize conflicts
                                if (!Array.isArray(data.conflicts)) {
                                    data.conflicts = [];
                                }
                                this.allUsers.push(data);
                                this.usersById[data.id] = data;
                            });
                            this.loading = false;
                        },
                        (error) => {
                            console.error('Firestore users snapshot error:', error);
                            console.error('Error message:', error.message);
                            this.error = 'Failed to load users: ' + error.message;
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

                const data = result?.data || {};
                const count = typeof data.pairingsCount === 'number' ? data.pairingsCount : 0;
                const timestamp = data.timestamp || new Date().toISOString();
                const warnings = Array.isArray(data.warnings) ? data.warnings : [];

                // Log warnings for debugging (without sensitive data)
                if (warnings.length > 0) {
                    console.info('Pairing warnings:', warnings);
                }

                this.pairingResult = {
                    success: true,
                    pairingsCount: count,
                    timestamp: timestamp,
                    warnings: warnings,
                    message: `Pairing successful! ${count} users paired.`
                };
            } catch (error) {
                console.error('Pairing error:', error.code, error.message);

                let errorMessage = 'Failed to trigger pairing';
                if (error.code === 'permission-denied') {
                    errorMessage = 'Permission denied. Admin access required.';
                } else if (error.message) {
                    errorMessage = error.message;
                }

                this.pairingResult = {
                    success: false,
                    message: errorMessage,
                    error: error.message
                };
                message: errorMessage
            };
        } finally {
            this.isProcessing = false;
        }
    },

        getUserNameById(id) {
        return this.usersById[id]?.name || id;
    },

        async addConflict(userId, otherUserId) {
        this.conflictActionFeedback = '';
        if (!userId || !otherUserId || userId === otherUserId) {
            this.conflictActionFeedback = 'Invalid selection.';
            return;
        }
        try {
            const batch = window.firebaseFirestore.batch();
            const userRef = window.firebaseFirestore.collection('users').doc(userId);
            const otherRef = window.firebaseFirestore.collection('users').doc(otherUserId);

            batch.update(userRef, { conflicts: firebase.firestore.FieldValue.arrayUnion(otherUserId) });
            batch.update(otherRef, { conflicts: firebase.firestore.FieldValue.arrayUnion(userId) });

            await batch.commit();
            this.conflictActionFeedback = 'Conflict added.';
        } catch (error) {
            console.error('Add conflict error:', error);
            this.conflictActionFeedback = error?.message || 'Failed to add conflict';
        }
    },

        async removeConflict(userId, otherUserId) {
        this.conflictActionFeedback = '';
        try {
            const batch = window.firebaseFirestore.batch();
            const userRef = window.firebaseFirestore.collection('users').doc(userId);
            const otherRef = window.firebaseFirestore.collection('users').doc(otherUserId);

            batch.update(userRef, { conflicts: firebase.firestore.FieldValue.arrayRemove(otherUserId) });
            batch.update(otherRef, { conflicts: firebase.firestore.FieldValue.arrayRemove(userId) });

            await batch.commit();
            this.conflictActionFeedback = 'Conflict removed.';
        } catch (error) {
            console.error('Remove conflict error:', error);
            this.conflictActionFeedback = error?.message || 'Failed to remove conflict';
        }
    },

    destroy() {
        // Clean up listeners
        if (this.unsubscribeUsers) {
            this.unsubscribeUsers();
        }
    }
};
};
