#!/usr/bin/env node

/**
 * Seeds Firebase emulators with test data
 * Usage: npm run seed (with emulators running)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET;

if (!PROJECT_ID || !STORAGE_BUCKET) {
    console.error('FIREBASE_PROJECT_ID and STORAGE_BUCKET are required to seed emulators.');
    process.exit(1);
}

// Initialize Firebase Admin with emulator settings
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

admin.initializeApp({
    projectId: PROJECT_ID,
    storageBucket: STORAGE_BUCKET
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

async function downloadPlaceholderImage(name, filename) {
    return new Promise((resolve, reject) => {
        const url = `${PLACEHOLDER_IMAGE_URL}${encodeURIComponent(name)}`;
        const filepath = path.join(__dirname, 'temp', filename);

        // Ensure temp directory exists
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(filepath);
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

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
    console.log('\n📸 Uploading profile pictures...');

    const pictureUrls = {};

    for (const user of USERS) {
        if (!user.userData.isAdmin) {
            try {
                // Download placeholder image
                const filename = `${user.uid}.png`;
                const tempPath = await downloadPlaceholderImage(user.displayName, filename);

                // Upload to Storage emulator
                const destination = `profile-pictures/${filename}`;
                await storage.upload(tempPath, {
                    destination: destination,
                    metadata: {
                        contentType: 'image/png'
                    }
                });

                // Generate emulator URL
                const storageUrl = `http://localhost:9199/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(destination)}?alt=media`;
                pictureUrls[user.uid] = storageUrl;

                console.log(`✅ Uploaded picture for: ${user.displayName}`);

                // Clean up temp file
                fs.unlinkSync(tempPath);
            } catch (error) {
                console.error(`❌ Error uploading picture for ${user.displayName}:`, error.message);
                // Use placeholder URL as fallback
                pictureUrls[user.uid] = `https://via.placeholder.com/150/4F46E5/FFFFFF?text=${encodeURIComponent(user.displayName)}`;
            }
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
