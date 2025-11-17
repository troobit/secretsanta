window.userDashboard = function userDashboard() {
    return {
        loading: true,
        error: '',
        userData: null,
        gifteeData: null,
        wishlistInput: '',
        savingWishlist: false,
        wishlistSaved: false,
        unsubscribeUser: null,

        async init() {
            // Wait for Firebase to be initialized
            const waitForFirebase = setInterval(() => {
                if (window.firebaseAuth && window.firebaseFirestore) {
                    clearInterval(waitForFirebase);
                    // Wait for auth state to be ready before initializing
                    this.waitForAuthState();
                }
            }, 50);
        },

        async waitForAuthState() {
            window.firebaseAuth.onAuthStateChanged((user) => {
                if (user) {
                    this.initializeDashboard();
                }
                // Don't show error - parent component handles auth redirect
            });
        },

        async initializeDashboard() {
            try {
                const user = window.firebaseAuth.currentUser;
                if (!user) {
                    this.loading = false;
                    return;
                }

                const userId = user.email.split('@')[0];

                // Set up real-time listener for user data
                this.unsubscribeUser = window.firebaseFirestore
                    .collection('users')
                    .doc(userId)
                    .onSnapshot(
                        async (doc) => {
                            if (doc.exists) {
                                this.userData = { id: doc.id, ...doc.data() };
                                this.wishlistInput = this.userData.wishlist || '';

                                // Fetch giftee data if gifteeId exists
                                if (this.userData.gifteeId) {
                                    await this.fetchGifteeData(this.userData.gifteeId);
                                } else {
                                    this.gifteeData = null;
                                }

                                this.loading = false;
                            } else {
                                this.error = 'User data not found';
                                this.loading = false;
                            }
                        },
                        (error) => {
                            this.error = 'Failed to load user data';
                            this.loading = false;
                        }
                    );
            } catch (error) {
                this.error = 'Failed to initialize dashboard';
                this.loading = false;
            }
        },

        async fetchGifteeData(gifteeId) {
            try {
                const gifteeDoc = await window.firebaseFirestore
                    .collection('users')
                    .doc(gifteeId)
                    .get();

                if (gifteeDoc.exists) {
                    this.gifteeData = { id: gifteeDoc.id, ...gifteeDoc.data() };
                }
            } catch (error) {
                this.gifteeData = null;
            }
        },

        async saveWishlist() {
            if (!this.userData) return;

            this.savingWishlist = true;
            this.wishlistSaved = false;

            try {
                await window.firebaseFirestore
                    .collection('users')
                    .doc(this.userData.id)
                    .update({
                        wishlist: this.wishlistInput.trim()
                    });

                this.wishlistSaved = true;

                // Hide success message after 3 seconds
                setTimeout(() => {
                    this.wishlistSaved = false;
                }, 3000);
            } catch (error) {
                this.error = 'Failed to save wishlist. Please try again.';
            } finally {
                this.savingWishlist = false;
            }
        },

        destroy() {
            // Clean up listener when component is destroyed
            if (this.unsubscribeUser) {
                this.unsubscribeUser();
            }
        }
    };
};
