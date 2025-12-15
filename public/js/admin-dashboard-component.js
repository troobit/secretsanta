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
            console.log('Initializing admin dashboard...');
            try {
                // Set up real-time listener for all non-admin users
                // Note: where('isAdmin', '!=', true) may require composite index
                // Alternative: fetch all users and filter client-side
                this.unsubscribeUsers = window.firebaseFirestore
                    .collection('users')
                    .onSnapshot(
                        (snapshot) => {
                            console.log('Users snapshot received, doc count:', snapshot.size);
                            this.allUsers = [];
                            this.usersById = {};
                            snapshot.forEach((doc) => {
                                const data = { id: doc.id, ...doc.data() };
                                console.log('Processing user:', data.id, 'isAdmin:', data.isAdmin);

                                // Filter out admin users client-side
                                if (data.isAdmin === true) {
                                    return;
                                }

                                // Normalize conflicts
                                if (!Array.isArray(data.conflicts)) {
                                    data.conflicts = [];
                                }
                                this.allUsers.push(data);
                                this.usersById[data.id] = data;
                            });
                            console.log('Filtered users count:', this.allUsers.length);
                            this.loading = false;
                        },
                        (error) => {
                            console.error('Firestore users snapshot error:', error);
                            console.error('Error code:', error.code);
                            console.error('Error message:', error.message);
                            this.error = 'Failed to load users: ' + error.message;
                            this.loading = false;
                        }
                    );
            } catch (error) {
                console.error('Dashboard init error:', error);
                this.error = 'Failed to initialize admin dashboard: ' + error.message;
                this.loading = false;
            }
        },

        async triggerPairing() {
            this.isProcessing = true;
            this.pairingResult = null;
            this.showConfirmation = false;

            try {
                const pairFunction = window.firebaseFunctions.httpsCallable('triggerSecretSantaPairing');
                const result = await pairFunction();

                const data = result?.data || {};
                const count = data.pairingsCount || 0;

                this.pairingResult = {
                    success: true,
                    pairingsCount: count,
                    message: `Pairing successful! ${count} users paired.`
                };
            } catch (error) {
                this.pairingResult = {
                    success: false,
                    message: 'Failed to trigger pairing'
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

                batch.update(userRef, { conflicts: window.firebaseFirestore.FieldValue.arrayUnion(otherUserId) });
                batch.update(otherRef, { conflicts: window.firebaseFirestore.FieldValue.arrayUnion(userId) });

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

                batch.update(userRef, { conflicts: window.firebaseFirestore.FieldValue.arrayRemove(otherUserId) });
                batch.update(otherRef, { conflicts: window.firebaseFirestore.FieldValue.arrayRemove(userId) });

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
