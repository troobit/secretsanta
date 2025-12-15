#!/usr/bin/env node

/**
 * Seeds Firebase emulators with test data
 * Usage: npm run seed (with emulators running)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Initialize Firebase Admin with emulator settings
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

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

function buildMutualConflicts(users) {
    const conflictSets = new Map();

    users.forEach((user) => {
        const conflicts = Array.isArray(user?.userData?.conflicts)
            ? user.userData.conflicts.filter((id) => typeof id === 'string' && id !== user.uid)
            : [];

        conflictSets.set(user.uid, new Set(conflicts));
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

// No local image downloads/uploads for MVP; use placeholder URLs only
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

            const conflicts = conflictSets.get(user.uid);
            userData.conflicts = conflicts ? Array.from(conflicts) : [];

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

function cleanupTempDir() {
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

async function main() {
    console.log('🚀 Starting Firebase Emulator seed process...\n');
    console.log('⚠️  Make sure Firebase emulators are running!');
    console.log('   Run: firebase emulators:start\n');

    let exitCode = 0;

    try {
        // Step 1: Create Auth users
        await createAuthUsers();

        // Step 2: Upload profile pictures
        const pictureUrls = await uploadProfilePictures();

        // Step 3: Normalize and write Firestore documents with conflicts
        const conflictSets = buildMutualConflicts(USERS);
        await createFirestoreDocuments(pictureUrls, conflictSets);

        console.log('\n✨ Seed complete\n');
        console.log('Emulator: http://localhost:4000');
        console.log('App: http://localhost:5000');
    } catch (error) {
        console.error('\n❌ Seed process failed:', error);
        exitCode = 1;
    } finally {
        cleanupTempDir();
        process.exit(exitCode);
    }
}

// Run the script
main();
