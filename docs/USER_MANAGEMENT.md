# User Management Scripts

This document explains how to create and manage users programmatically using scripts, rather than manually through the Firebase console or emulator UI.

## Overview

User management involves two steps:
1. **Firebase Auth**: Create authentication accounts (`name@secretsanta.app`)
2. **Firestore**: Create corresponding user documents with profile data

Scripts can automate both steps for development (emulator) and production environments.

## Prerequisites

- Node.js installed
- Firebase Admin SDK
- Firebase project credentials (for production) or running emulators (for development)

## Setup

### 1. Create Scripts Directory

```bash
mkdir scripts
cd scripts
npm init -y
npm install firebase-admin
```

### 2. Create User Management Script

Create `scripts/manage-users.js`:

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
// For emulator: no credentials needed, just set environment variables
// For production: use service account key
if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  // Emulator mode
  admin.initializeApp({
    projectId: 'demo-project'
  });
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
} else {
  // Production mode - requires service account key
  const serviceAccount = require('./service-account-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();
const db = admin.firestore();

// User definitions
const users = [
  {
    email: 'john@secretsanta.app',
    password: 'password123',
    userData: {
      name: 'John Smith',
      wishlist: 'Books, coffee, woolly socks',
      votedAmount: 50,
      profilePicUrl: 'https://firebasestorage.googleapis.com/.../john.jpg',
      gifteeId: null,
      isAdmin: false
    }
  },
  {
    email: 'mary@secretsanta.app',
    password: 'password123',
    userData: {
      name: 'Mary Johnson',
      wishlist: 'Tea, chocolate, cosy blanket',
      votedAmount: 50,
      profilePicUrl: 'https://firebasestorage.googleapis.com/.../mary.jpg',
      gifteeId: null,
      isAdmin: false
    }
  },
  {
    email: 'admin@secretsanta.app',
    password: 'adminpass456',
    userData: {
      name: 'Admin User',
      isAdmin: true
    }
  }
];

async function createUser(email, password, userData) {
  const userId = email.split('@')[0]; // Extract name before @
  
  try {
    // 1. Create auth user
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: userData.name
      });
      console.log(`✅ Created auth user: ${email}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        userRecord = await auth.getUserByEmail(email);
        console.log(`ℹ️  Auth user already exists: ${email}`);
      } else {
        throw error;
      }
    }

    // 2. Create/update Firestore document
    await db.collection('users').doc(userId).set(userData, { merge: true });
    console.log(`✅ Created/updated Firestore doc: users/${userId}`);
    
    return { success: true, userId };
  } catch (error) {
    console.error(`❌ Error creating user ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function createAllUsers() {
  console.log('🚀 Starting user creation...\n');
  
  const results = await Promise.all(
    users.map(user => createUser(user.email, user.password, user.userData))
  );
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📊 Summary: ${successful} succeeded, ${failed} failed`);
}

async function initializeSettings() {
  try {
    await db.collection('settings').doc('config').set({
      lockInTime: null
    }, { merge: true });
    console.log('✅ Initialized settings document');
  } catch (error) {
    console.error('❌ Error initializing settings:', error.message);
  }
}

// Main execution
(async () => {
  try {
    await createAllUsers();
    await initializeSettings();
    console.log('\n✨ User management complete!');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();
```

## Usage

### Development (Emulator)

1. Start Firebase emulators:
   ```bash
   firebase emulators:start
   ```

2. In another terminal, run the script:
   ```bash
   cd scripts
   FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 node manage-users.js
   ```

### Production

1. Download service account key from Firebase Console:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `scripts/service-account-key.json`
   - **IMPORTANT**: Add to `.gitignore`!

2. Run the script:
   ```bash
   cd scripts
   node manage-users.js
   ```

## Customizing Users

Edit the `users` array in `manage-users.js`:

### Regular User Template
```javascript
{
  email: 'username@secretsanta.app',
  password: 'their-password',
  userData: {
    name: 'Display Name',
    wishlist: 'Gift preferences',
    votedAmount: 50,
    profilePicUrl: 'https://firebasestorage.googleapis.com/.../pic.jpg',
    gifteeId: null,
    isAdmin: false
  }
}
```

### Admin User Template
```javascript
{
  email: 'admin@secretsanta.app',
  password: 'admin-password',
  userData: {
    name: 'Admin Name',
    isAdmin: true
  }
}
```

## Advanced: Update Existing Users

Add this function to `manage-users.js`:

```javascript
async function updateUser(userId, updates) {
  try {
    await db.collection('users').doc(userId).update(updates);
    console.log(`✅ Updated user: ${userId}`);
  } catch (error) {
    console.error(`❌ Error updating user ${userId}:`, error.message);
  }
}

// Example usage:
// await updateUser('john', { wishlist: 'New wishlist items' });
```

## Security Notes

1. **Never commit `service-account-key.json`** to version control
2. Store production passwords securely (use environment variables or secrets manager)
3. Use strong passwords for production accounts
4. Regularly rotate service account keys
5. Limit service account permissions to only what's needed

## Troubleshooting

### "Failed to create user: auth/weak-password"
Passwords must be at least 6 characters. Update passwords in the `users` array.

### "Failed to create user: permission-denied"
Ensure Firestore rules allow the operation, or use Admin SDK which bypasses rules.

### "ECONNREFUSED" when connecting to emulator
Ensure emulators are running: `firebase emulators:start`

### Script hangs or doesn't exit
The script includes `process.exit()`. If it hangs, check for unresolved promises or unclosed connections.

## npm Scripts

Add to `scripts/package.json` for convenience:

```json
{
  "scripts": {
    "setup:emulator": "FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 node manage-users.js",
    "setup:production": "node manage-users.js"
  }
}
```

Then run:
```bash
npm run setup:emulator   # For local development
npm run setup:production # For production
