# Development Plan: Secret Santa Web App

## Project Goal
Create a simple, mobile-first Secret Santa web app with a minimal, free-tier-friendly stack using Firebase services. The app enables users to manage their Secret Santa participation, view their assigned giftee after randomisation, and update their wishlists. Admin functionality includes triggering the random pairing via a secure backend function.

## Requirements & Constraints
- **Tech Stack**: Single `index.html` with TailwindCSS and Alpine.js; Firebase (Blaze plan for access, free tier for $0 cost)
- **Hosting**: Firebase Hosting with custom domain; manual deployment via `firebase deploy`
- **Authentication**: Firebase Auth with name + password (dummy domain `@secretsanta.app` appended); pre-created accounts
- **Database**: Cloud Firestore with `users` collection (name, wishlist, votedAmount, profilePicUrl, gifteeId) and `settings` collection (lockInTime)
- **Storage**: Firebase Storage for admin-uploaded profile pictures
- **Backend Logic**: Python Cloud Function for secure random pairing (triggered by admin)
- **Development**: Local development using Firebase Local Emulator Suite (Auth, Firestore, Functions)
- **Language**: Irish English for all UI text
- **Multi-user Support**: Multiple users can log in independently
- **Post-randomisation**: Users cannot edit details (except wishlist) after pairing; pairings persist across logins
- **No Automated Testing**: Manual validation by developer

## Plan

### Phase 1: Project Setup & Configuration
- [ ] 1.1 Configure Firebase project settings
  - [ ] 1.1.a Update `firebase.json` to include Functions and Emulators configuration
  - [ ] 1.1.b Configure emulator settings for Auth, Firestore, Functions, and Hosting
  - [ ] 1.1.c Add Storage configuration to `firebase.json`
- [ ] 1.2 Set up Firestore security rules
  - [ ] 1.2.a Define security rules for `users` collection (authenticated users can read all, write only own document)
  - [ ] 1.2.b Define security rules for `settings` collection (authenticated users can read, admin can write)
  - [ ] 1.2.c Add rule to prevent updates to user fields after `lockInTime` (except wishlist)
  - [ ] 1.2.d Update `firestore.rules` with production-ready rules
- [ ] 1.3 Configure Firebase Storage rules
  - [ ] 1.3.a Create `storage.rules` file
  - [ ] 1.3.b Define rules allowing admin uploads and public reads for profile pictures
- [ ] 1.4 Set up Cloud Functions for Python
  - [ ] 1.4.a Update `functions/requirements.txt` with required dependencies (firebase-admin, firebase-functions)
  - [ ] 1.4.b Configure Functions environment for emulator support

### Phase 2: Database Schema & Initialisation
- [ ] 2.1 Define Firestore data structure
  - [ ] 2.1.a Document `users` collection schema (name: string, wishlist: string, votedAmount: number, profilePicUrl: string, gifteeId: string|null)
  - [ ] 2.1.b Document `settings` collection schema (lockInTime: Timestamp|null)
- [ ] 2.2 Create development setup guide in `docs/SETUP.md`
  - [ ] 2.2.a Document Firebase Auth user creation steps (format: `name@secretsanta.app`)
  - [ ] 2.2.b Document Firestore user document structure and sample data
  - [ ] 2.2.c Document Storage profile picture upload process
  - [ ] 2.2.d Document emulator initialization steps

### Phase 3: Frontend Structure (HTML & TailwindCSS)
- [ ] 3.1 Create base HTML structure in `public/index.html`
  - [ ] 3.1.a Add meta tags (viewport, charset, description)
  - [ ] 3.1.b Include TailwindCSS via CDN (using Play CDN for development)
  - [ ] 3.1.c Include Alpine.js via CDN
  - [ ] 3.1.d Include Firebase SDK scripts (Auth, Firestore, Functions, Storage)
  - [ ] 3.1.e Add Firebase initialization script with emulator detection
- [ ] 3.2 Create mobile-first layout sections
  - [ ] 3.2.a Create login section (hidden when authenticated)
  - [ ] 3.2.b Create dashboard section (visible when authenticated, non-admin)
  - [ ] 3.2.c Create admin section (visible when authenticated, admin user)
  - [ ] 3.2.d Add navigation/header with logout button

### Phase 4: Firebase Initialization & Emulator Configuration
- [ ] 4.1 Set up Firebase SDK configuration
  - [ ] 4.1.a Add Firebase config object (to be populated from Firebase console)
  - [ ] 4.1.b Initialize Firebase App
  - [ ] 4.1.c Initialize Firebase services (Auth, Firestore, Functions, Storage)
- [ ] 4.2 Configure emulator connection (optional for local development)
  - [ ] 4.2.a Add environment variable or config flag (e.g., `USE_EMULATOR`)
  - [ ] 4.2.b Connect to emulators when flag is set (Auth, Firestore, Functions, Storage)

### Phase 5: Authentication Implementation (Alpine.js)
- [ ] 5.1 Create Alpine.js authentication component
  - [ ] 5.1.a Initialize Alpine data with authentication state (user, loading, error)
  - [ ] 5.1.b Create login method that appends `@secretsanta.app` to username
  - [ ] 5.1.c Implement `signInWithEmailAndPassword` call
  - [ ] 5.1.d Create logout method using `signOut`
  - [ ] 5.1.e Add `onAuthStateChanged` listener to update state
- [ ] 5.2 Build login form UI
  - [ ] 5.2.a Create form with name input field (Irish English labels)
  - [ ] 5.2.b Create password input field
  - [ ] 5.2.c Add login button with loading state
  - [ ] 5.2.d Add error message display area
  - [ ] 5.2.e Style form with TailwindCSS (mobile-first)

### Phase 6: User Dashboard Implementation
- [ ] 6.1 Create Alpine.js dashboard component
  - [ ] 6.1.a Initialize data structure (userData, gifteeData, isLocked, settings)
  - [ ] 6.1.b Fetch current user data from Firestore
  - [ ] 6.1.c Fetch settings data to check lockInTime
  - [ ] 6.1.d Calculate `isLocked` status based on lockInTime
  - [ ] 6.1.e Fetch giftee data when gifteeId exists
- [ ] 6.2 Build user profile section
  - [ ] 6.2.a Display user's profile picture
  - [ ] 6.2.b Display user's name
  - [ ] 6.2.c Display user's voted amount (read-only)
  - [ ] 6.2.d Create wishlist textarea (editable always)
  - [ ] 6.2.e Add save button for wishlist updates
- [ ] 6.3 Build giftee reveal section
  - [ ] 6.3.a Show "Pairing not yet complete" message when gifteeId is null
  - [ ] 6.3.b Display giftee's profile picture when assigned
  - [ ] 6.3.c Display giftee's name when assigned
  - [ ] 6.3.d Display giftee's wishlist when assigned
  - [ ] 6.3.e Display giftee's voted amount when assigned
- [ ] 6.4 Implement data update functionality
  - [ ] 6.4.a Create method to update wishlist in Firestore
  - [ ] 6.4.b Add error handling for failed updates
  - [ ] 6.4.c Add success feedback for updates
  - [ ] 6.4.d Implement real-time listener for user data changes

### Phase 7: Admin Dashboard Implementation
- [ ] 7.1 Create Alpine.js admin component
  - [ ] 7.1.a Initialize data structure (allUsers, settings, isProcessing, results)
  - [ ] 7.1.b Fetch all users from Firestore
  - [ ] 7.1.c Fetch current settings (lockInTime)
  - [ ] 7.1.d Determine admin status (check user email or specific admin flag)
- [ ] 7.2 Build user management view
  - [ ] 7.2.a Create table/list of all users
  - [ ] 7.2.b Display user names, wishlist status, voted amounts
  - [ ] 7.2.c Show current pairing status for each user
  - [ ] 7.2.d Add profile picture thumbnails
- [ ] 7.3 Build randomisation controls
  - [ ] 7.3.a Add "Trigger Pairing" button (disabled if already locked)
  - [ ] 7.3.b Display lockInTime status
  - [ ] 7.3.c Add confirmation dialogue for triggering randomisation
  - [ ] 7.3.d Add loading state during randomisation
  - [ ] 7.3.e Display results/errors after randomisation
- [ ] 7.4 Implement randomisation trigger
  - [ ] 7.4.a Call Cloud Function to perform pairing
  - [ ] 7.4.b Handle success response
  - [ ] 7.4.c Handle error response
  - [ ] 7.4.d Update UI to reflect locked state

### Phase 8: Cloud Function - Random Pairing Logic
- [ ] 8.1 Create Python Cloud Function structure
  - [ ] 8.1.a Define HTTPS callable function in `functions/main.py`
  - [ ] 8.1.b Initialize Firebase Admin SDK
  - [ ] 8.1.c Add function authentication check (admin only)
- [ ] 8.2 Implement pairing algorithm
  - [ ] 8.2.a Fetch all users from Firestore
  - [ ] 8.2.b Validate minimum user count (at least 3 users)
  - [ ] 8.2.c Implement Fisher-Yates shuffle algorithm
  - [ ] 8.2.d Create circular pairing (user[0] -> user[1], user[1] -> user[2], ..., user[n] -> user[0])
  - [ ] 8.2.e Validate no self-assignments
- [ ] 8.3 Update database with pairings
  - [ ] 8.3.a Use batch write to update all user gifteeId fields
  - [ ] 8.3.b Set lockInTime in settings collection to current timestamp
  - [ ] 8.3.c Commit transaction
  - [ ] 8.3.d Return success response with pairing count
- [ ] 8.4 Add error handling
  - [ ] 8.4.a Handle insufficient user count
  - [ ] 8.4.b Handle already locked state
  - [ ] 8.4.c Handle Firestore write failures
  - [ ] 8.4.d Return appropriate error responses

### Phase 9: Styling & Mobile Optimization
- [ ] 9.1 Apply TailwindCSS styling throughout
  - [ ] 9.1.a Style login form (centered card, responsive padding)
  - [ ] 9.1.b Style dashboard sections (cards, spacing, typography)
  - [ ] 9.1.c Style admin interface (tables/lists, buttons, status indicators)
  - [ ] 9.1.d Add colour scheme (festive but minimal)
  - [ ] 9.1.e (OPTIONAL) Add per-user custom CSS support (check logged-in username, load matching CSS file if exists)
- [ ] 9.2 Optimize for mobile devices
  - [ ] 9.2.a Test and adjust touch targets (minimum 44x44px)
  - [ ] 9.2.b Ensure readable font sizes (minimum 16px for inputs)
  - [ ] 9.2.c Optimize image sizes for mobile
  - [ ] 9.2.d Test on various screen sizes (320px - 428px width)
- [ ] 9.3 Add responsive behaviour
  - [ ] 9.3.a Implement mobile-first breakpoints
  - [ ] 9.3.b Adjust layout for tablet sizes (768px+)
  - [ ] 9.3.c Adjust layout for desktop sizes (1024px+)

### Phase 10: Local Development & Testing
- [ ] 10.1 Set up Firebase Emulator Suite
  - [ ] 10.1.a Install Firebase CLI globally
  - [ ] 10.1.b Initialize emulators (`firebase init emulators`)
  - [ ] 10.1.c Configure emulator ports in `firebase.json`
  - [ ] 10.1.d Start emulators (`firebase emulators:start`)
- [ ] 10.2 Create test data in emulators
  - [ ] 10.2.a Create test users in Auth emulator
  - [ ] 10.2.b Add test user documents to Firestore emulator
  - [ ] 10.2.c Upload test profile pictures to Storage emulator
  - [ ] 10.2.d Create settings document with null lockInTime
- [ ] 10.3 Manual testing workflow
  - [ ] 10.3.a **VALIDATION CHECKPOINT:** Test login with test user credentials
  - [ ] 10.3.b **VALIDATION CHECKPOINT:** Verify dashboard loads user data correctly
  - [ ] 10.3.c **VALIDATION CHECKPOINT:** Test wishlist update and save
  - [ ] 10.3.d **VALIDATION CHECKPOINT:** Test admin view shows all users
  - [ ] 10.3.e **VALIDATION CHECKPOINT:** Trigger randomisation and verify pairings
  - [ ] 10.3.f **VALIDATION CHECKPOINT:** Verify giftee appears in user dashboard after pairing
  - [ ] 10.3.g **VALIDATION CHECKPOINT:** Verify fields are locked after randomisation (except wishlist)
  - [ ] 10.3.h **VALIDATION CHECKPOINT:** Test logout and re-login preserves pairings

### Phase 11: Production Deployment Preparation
- [ ] 11.1 Configure Firebase project for production
  - [ ] 11.1.a Create Firebase project in console (or use existing)
  - [ ] 11.1.b Enable Email/Password authentication in console
  - [ ] 11.1.c Deploy Firestore security rules
  - [ ] 11.1.d Deploy Storage security rules
  - [ ] 11.1.e Set up billing (Blaze plan)
- [ ] 11.2 Create production user accounts
  - [ ] 11.2.a Create user accounts in Firebase Auth console with format `name@secretsanta.app`
  - [ ] 11.2.b Set passwords for each user
  - [ ] 11.2.c Create corresponding user documents in Firestore
  - [ ] 11.2.d Upload profile pictures to Firebase Storage
  - [ ] 11.2.e Update profilePicUrl fields in user documents
- [ ] 11.3 Update Firebase configuration in code
  - [ ] 11.3.a Replace Firebase config object with production values
  - [ ] 11.3.b Ensure emulator detection only triggers on localhost
  - [ ] 11.3.c Remove or comment out development-only code
- [ ] 11.4 Deploy Cloud Functions
  - [ ] 11.4.a Run `firebase deploy --only functions`
  - [ ] 11.4.b Verify function deployment in Firebase console
  - [ ] 11.4.c Test function in production environment

### Phase 12: Hosting & Domain Configuration
- [ ] 12.1 Deploy to Firebase Hosting
  - [ ] 12.1.a Build/prepare static assets in `public/` directory
  - [ ] 12.1.b Run `firebase deploy --only hosting`
  - [ ] 12.1.c Verify deployment at Firebase-provided URL
- [ ] 12.2 Configure custom domain
  - [ ] 12.2.a Add custom domain in Firebase Hosting console
  - [ ] 12.2.b Update DNS records with provided values
  - [ ] 12.2.c Wait for SSL certificate provisioning
  - [ ] 12.2.d Verify site accessible via custom domain
- [ ] 12.3 Final production validation
  - [ ] 12.3.a **VALIDATION CHECKPOINT:** Test login with production credentials
  - [ ] 12.3.b **VALIDATION CHECKPOINT:** Verify all users can access dashboards
  - [ ] 12.3.c **VALIDATION CHECKPOINT:** Test admin randomisation in production
  - [ ] 12.3.d **VALIDATION CHECKPOINT:** Verify mobile responsiveness on real devices
  - [ ] 12.3.e **VALIDATION CHECKPOINT:** Test all CRUD operations (read user data, update wishlist)

## Success Criteria (Measurable)

- [ ] Users can log in using their name (without manually typing `@secretsanta.app`)
- [ ] Users see their own profile information (name, picture, voted amount, wishlist)
- [ ] Users can update their wishlist at any time
- [ ] Users see "Pairing not yet complete" message before admin triggers randomisation
- [ ] After randomisation, users see their assigned giftee's details (name, picture, wishlist, voted amount)
- [ ] After randomisation, users cannot edit their profile details except wishlist
- [ ] Admin can view all users and their current status
- [ ] Admin can trigger randomisation via a button (only once)
- [ ] Randomisation creates valid pairings (no self-assignments, everyone assigned exactly once)
- [ ] Randomisation sets lockInTime, preventing future randomisation
- [ ] Pairings persist across user logout/login cycles
- [ ] App works correctly on mobile devices (320px - 428px screen width)
- [ ] App connects to emulators when running on localhost
- [ ] App connects to production Firebase when deployed
- [ ] Custom domain resolves correctly to Firebase Hosting
- [ ] All text and labels use Irish English spelling and terminology

## Agent Log

- **PLANNER:** Initial plan created. Status: Complete. Comprehensive 12-phase development plan established covering setup, implementation, testing, and deployment.
- **PLANNER:** Updated plan based on feedback. Status: Complete. Modified Phase 2.2 to target docs directory, simplified Phase 4.2 emulator configuration, added optional per-user CSS in Phase 9.1.e.
