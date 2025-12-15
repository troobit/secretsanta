#!/usr/bin/env node

/**
 * Deploys user data to production Firebase
 * Usage: npm run deploy:users (requires `firebase login` first)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Initialize Firebase Admin for production (uses ADC from `firebase login`)
admin.initializeApp({
    projectId: 'secretsanta-melb',
    storageBucket: 'secretsanta-melb.appspot.com'
});

const auth = admin.auth();
const db = admin.firestore();
const storage = admin.storage().bucket();

// Test data configuration
const USERS = require('./users.json');

// Placeholder image URL for downloading
const PLACEHOLDER_IMAGE_URL = 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=';

function normalizeConflicts(user) {
    const conflicts = Array.isArray(user?.userData?.conflicts)
        ? user.userData.conflicts
        : [];

    const filtered = conflicts.filter((uid) => typeof uid === 'string' && uid !== user.uid);
    return Array.from(new Set(filtered));
}

function buildMutualConflicts(users) {
    const conflictSets = new Map();

    users.forEach((user) => {
        conflictSets.set(user.uid, new Set(normalizeConflicts(user)));
    });

    for (const [uid, conflicts] of conflictSets.entries()) {
        for (const conflictedUid of conflicts) {
            if (!conflictSets.has(conflictedUid)) {
                conflictSets.set(conflictedUid, new Set([uid]));
            } else {
                conflictSets.get(conflictedUid).add(uid);
            }
        }
    }

    return conflictSets;
}

// No image downloads/uploads for MVP; use placeholder URLs only
// Placeholder image source: https://static.photos/people/320x240/162

async function createAuthUsers() {
    console.log('\n📝 Creating Auth users...');

    for (const user of USERS) {
        try {
            await auth.createUser({
                uid: user.uid,
                email: user.email,
                password: user.password,
                displayName: user.displayName
            });
            console.log(`✅ Created user: ${user.email}`);
        } catch (error) {
            if (error.code === 'auth/uid-already-exists') {
                console.log(`⚠️  User already exists: ${user.email}`);
            } else {
                console.error(`❌ Error creating user ${user.email}:`, error.message);
            }
        }
    }
}

async function uploadProfilePictures() {
    console.log('\n📸 Setting placeholder profile pictures (no uploads)...');

    const pictureUrls = {};

    for (const user of USERS) {
        if (!user.userData.isAdmin) {
            // Use one common placeholder URL for all non-admin users
            pictureUrls[user.uid] = 'https://static.photos/people/320x240/162';
            console.log(`✅ Placeholder picture set for: ${user.displayName}`);
        }
    }

    return pictureUrls;
}

async function createFirestoreDocuments(pictureUrls, conflictSets) {
    console.log('\n🗄️  Creating Firestore documents...');

    // Create user documents
    for (const user of USERS) {
        try {
            const userData = { ...user.userData };

            if (!userData.isAdmin) {
                const conflicts = conflictSets?.get(user.uid) || new Set();
                userData.conflicts = Array.from(conflicts);
            }

            // Add profile picture URL for non-admin users
            if (!user.userData.isAdmin && pictureUrls[user.uid]) {
                userData.profilePicUrl = pictureUrls[user.uid];
            }

            await db.collection('users').doc(user.uid).set(userData);
            console.log(`✅ Created Firestore doc: users/${user.uid}`);
        } catch (error) {
            console.error(`❌ Error creating doc for ${user.uid}:`, error.message);
        }
    }
}

function cleanup() {
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

async function main() {
    console.log('🚀 Starting Firebase Production deployment...\n');
    console.log('⚠️  Make sure you are logged in with: firebase login\n');

    try {
        // Step 1: Create Auth users
        await createAuthUsers();

        // Step 2: Upload profile pictures
        const pictureUrls = await uploadProfilePictures();

        // Step 3: Normalize conflicts and create Firestore documents
        const conflictSets = buildMutualConflicts(USERS);
        await createFirestoreDocuments(pictureUrls, conflictSets);

        console.log('\n✨ Production deployment completed successfully!\n');
        console.log('Users deployed to Firebase. Check the Firebase Console to verify.');

    } catch (error) {
        console.error('\n❌ Production deployment failed:', error);
        process.exit(1);
    } finally {
        cleanup();
        process.exit(0);
    }
}

// Run the script
main();
