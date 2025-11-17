# Development Setup Guide

This guide covers setting up the Secret Santa app for local development using Firebase Emulators.

## Prerequisites

- Node.js and npm installed
- Firebase CLI installed globally: `npm install -g firebase-tools`
- Firebase project created (or use emulator-only development)

## Initial Setup

### 1. Clone and Install

```bash
cd secretsanta
npm install -g firebase-tools  # if not already installed
```

### 2. Firebase Login

```bash
firebase login
```

### 3. Initialize Firebase (if needed)

The project is already configured with `firebase.json`. If starting fresh:

```bash
firebase init
# Select: Emulators, Hosting, Firestore, Functions, Storage
```

## Local Development with Emulators

### 1. Start Emulators

```bash
firebase emulators:start
```

This starts:
- **Auth Emulator**: http://localhost:9099
- **Firestore Emulator**: http://localhost:8080
- **Functions Emulator**: http://localhost:5001
- **Hosting Emulator**: http://localhost:5000
- **Storage Emulator**: http://localhost:9199
- **Emulator UI**: http://localhost:4000

### 2. Create Test Users (Auth Emulator)

#### Option A: Via Emulator UI
1. Open http://localhost:4000
2. Go to Authentication tab
3. Add users manually:
   - **Email**: `john@secretsanta.app`, **Password**: `password123`
   - **Email**: `mary@secretsanta.app`, **Password**: `password123`
   - **Email**: `paul@secretsanta.app`, **Password**: `password123`
   - **Email**: `admin@secretsanta.app`, **Password**: `admin123`

#### Option B: Via Firebase Admin SDK Script
Create a setup script or use the Emulator UI's import feature.

### 3. Create User Documents (Firestore Emulator)

#### Via Emulator UI
1. Open http://localhost:4000
2. Go to Firestore tab
3. Create collection: `users`
4. Add documents:

**Document ID**: `john`
```json
{
  "name": "John Smith",
  "wishlist": "Books, coffee, warm socks",
  "votedAmount": 50,
  "profilePicUrl": "https://via.placeholder.com/150",
  "gifteeId": null
}
```

**Document ID**: `mary`
```json
{
  "name": "Mary O'Brien",
  "wishlist": "Tea, candles, cosy blanket",
  "votedAmount": 50,
  "profilePicUrl": "https://via.placeholder.com/150",
  "gifteeId": null
}
```

**Document ID**: `paul`
```json
{
  "name": "Paul Murphy",
  "wishlist": "Whiskey, books, board games",
  "votedAmount": 50,
  "profilePicUrl": "https://via.placeholder.com/150",
  "gifteeId": null
}
```

**Document ID**: `admin`
```json
{
  "name": "Admin User",
  "wishlist": "Nothing needed",
  "votedAmount": 0,
  "profilePicUrl": "https://via.placeholder.com/150",
  "gifteeId": null
}
```

### 4. Create Settings Document (Firestore Emulator)

1. Create collection: `settings`
2. Add document:

**Document ID**: `config`
```json
{
  "lockInTime": null
}
```

### 5. Upload Profile Pictures (Storage Emulator)

#### Via Emulator UI
1. Open http://localhost:4000
2. Go to Storage tab
3. Create folder: `profile-pictures`
4. Upload test images:
   - `john.jpg`
   - `mary.jpg`
   - `paul.jpg`
   - `admin.jpg`

#### Using Placeholder Images
For quick development, use the placeholder URLs already in the user documents above, or replace with actual image URLs after uploading.

### 6. Update Profile Picture URLs

After uploading images, update the `profilePicUrl` fields in user documents to match the Storage URLs:

Format: `http://localhost:9199/v0/b/{project-id}.appspot.com/o/profile-pictures%2F{filename}?alt=media`

## Testing the Application

### 1. Access the App
Open http://localhost:5000 in your browser

### 2. Test User Login
- Username: `john` (without @secretsanta.app)
- Password: `password123`

### 3. Test Admin Login
- Username: `admin`
- Password: `admin123`

### 4. Test Workflow
1. Login as regular user → see dashboard
2. Update wishlist → save changes
3. Login as admin → see all users
4. Trigger pairing → system locks
5. Login as regular user → see assigned giftee
6. Try to update non-wishlist fields → should fail

## Emulator Data Persistence

### Export Data
```bash
firebase emulators:export ./emulator-data
```

### Import Data on Start
```bash
firebase emulators:start --import=./emulator-data
```

### Auto-save on Exit
```bash
firebase emulators:start --import=./emulator-data --export-on-exit
```

## Troubleshooting

### Port Already in Use
Change ports in `firebase.json` under `emulators` section.

### Emulator Not Connecting
Check the app detects `localhost` and connects to emulators. The app should automatically connect when running on localhost.

### Functions Not Loading
Ensure Python dependencies are installed:
```bash
cd functions
pip install -r requirements.txt
```

### Clear All Data
Stop emulators and delete `emulator-data/` directory, then restart.

## Production Setup Notes

For production deployment, you'll need to:
1. Create real user accounts in Firebase Console
2. Upload actual profile pictures to Firebase Storage
3. Create user documents in Firestore
4. Update `public/index.html` with production Firebase config
5. Deploy: `firebase deploy`

See `DEVELOPMENT_PLAN.md` Phase 11 for detailed production deployment steps.
