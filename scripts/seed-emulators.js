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
const USERS = [
    {
        uid: 'john',
        email: 'john@a.a',
        password: 'password123',
        displayName: 'John',
        userData: {
            name: 'John',
            wishlist: 'Books, coffee, socks',
            profilePicUrl: '',
            gifteeId: null,
            isAdmin: false
        }
    },
    {
        uid: 'mary',
        email: 'mary@a.a',
        password: 'password123',
        displayName: 'Mary',
        userData: {
            name: 'Mary',
            wishlist: 'Tea, candles, blankets',
            profilePicUrl: '',
            gifteeId: null,
            isAdmin: false
        }
    },
    {
        uid: 'paul',
        email: 'paul@a.a',
        password: 'password123',
        displayName: 'Paul',
        userData: {
            name: 'Paul',
            wishlist: 'Whiskey, books, board games',
            profilePicUrl: '',
            gifteeId: null,
            isAdmin: false
        }
    },
    {
        uid: 'admin',
        email: 'admin@a.a',
        password: 'admin123',
        displayName: 'admin',
        userData: {
            name: 'admin',
            isAdmin: true
        }
    }
];

// Placeholder image URL for downloading
const PLACEHOLDER_IMAGE_URL = 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=';

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
                const storageUrl = `http://localhost:9199/v0/b/secretsanta-melb.appspot.com/o/${encodeURIComponent(destination)}?alt=media`;
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

async function createFirestoreDocuments(pictureUrls) {
    console.log('\n🗄️  Creating Firestore documents...');

    // Create user documents
    for (const user of USERS) {
        try {
            const userData = { ...user.userData };

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

    // Create settings document
    try {
        await db.collection('settings').doc('config').set({
            lockInTime: null
        });
        console.log('✅ Created Firestore doc: settings/config');
    } catch (error) {
        console.error('❌ Error creating settings doc:', error.message);
    }
}

function cleanup() {
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

async function main() {
    console.log('🚀 Starting Firebase Emulator seed process...\n');
    console.log('⚠️  Make sure Firebase emulators are running!');
    console.log('   Run: firebase emulators:start\n');

    try {
        // Step 1: Create Auth users
        await createAuthUsers();

        // Step 2: Upload profile pictures
        const pictureUrls = await uploadProfilePictures();

        // Step 3: Create Firestore documents
        await createFirestoreDocuments(pictureUrls);

        console.log('\n✨ Seed process completed successfully!\n');
        console.log('You can now:');
        console.log('1. View emulator data at: http://localhost:4000');
        console.log('2. Access the app at: http://localhost:5000');
        console.log('3. Login with:');
        console.log('   - User: john / password123');
        console.log('   - User: mary / password123');
        console.log('   - User: paul / password123');
        console.log('   - Admin: admin / admin123\n');

    } catch (error) {
        console.error('\n❌ Seed process failed:', error);
        process.exit(1);
    } finally {
        cleanup();
        process.exit(0);
    }
}

// Run the script
main();
