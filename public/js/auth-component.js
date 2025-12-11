window.secretSantaApp = function secretSantaApp() {
    return {
        user: null,
        isAdmin: false,
        loading: true,
        loginForm: {
            name: '',
            password: '',
            loading: false,
            error: ''
        },

        init() {
            // Wait for Firebase to be initialized before setting up auth listener
            const waitForFirebase = setInterval(() => {
                if (window.firebaseAuth && window.firebaseFirestore) {
                    clearInterval(waitForFirebase);

                    // Set up auth state listener
                    window.firebaseAuth.onAuthStateChanged(async (user) => {
                        this.user = user;
                        this.updateTheme();

                        // Check if user is admin by fetching their Firestore document
                        if (user) {
                            try {
                                const userId = user.email.split('@')[0];
                                const userDoc = await window.firebaseFirestore.collection('users').doc(userId).get();

                                if (userDoc.exists) {
                                    this.isAdmin = userDoc.data().isAdmin === true;
                                } else {
                                    this.isAdmin = false;
                                }
                            } catch (error) {
                                this.isAdmin = false;
                            }
                        } else {
                            this.isAdmin = false;
                        }

                        // Set loading to false after admin check completes
                        this.loading = false;
                    });
                }
            }, 50);
        },

        login() {
            this.loginForm.error = '';
            this.loginForm.loading = true;

            const email = this.loginForm.name.trim().toLowerCase() + '@rtob.dev';
            const password = this.loginForm.password;

            if (window.firebaseAuth) {
                window.firebaseAuth.signInWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        this.loginForm.name = '';
                        this.loginForm.password = '';
                        this.loginForm.loading = false;
                    })
                    .catch((error) => {
                        this.loginForm.error = 'Login failed';
                        this.loginForm.loading = false;
                    });
            } else {
                this.loginForm.error = 'Firebase not initialized. Please refresh the page.';
                this.loginForm.loading = false;
            }
        },

        logout() {
            if (window.firebaseAuth) {
                window.firebaseAuth.signOut();
            }
        },

        updateTheme() {
            const existing = document.getElementById('user-custom-css');

            // If no user, remove any custom stylesheet
            if (!this.user || !this.user.email) {
                if (existing && existing.parentNode) {
                    existing.parentNode.removeChild(existing);
                }
                return;
            }

            const username = this.user.email.split('@')[0].toLowerCase();

            if (existing) {
                existing.href = `css/${username}.css`;
            } else {
                const link = document.createElement('link');
                link.id = 'user-custom-css';
                link.rel = 'stylesheet';
                link.href = `css/${username}.css`;
                document.head.appendChild(link);
            }
        }
    };
};
