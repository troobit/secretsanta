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

                // Upload to Storage
                const destination = `profile-pictures/${filename}`;
                await storage.upload(tempPath, {
                    destination: destination,
                    metadata: {
                        contentType: 'image/png'
                    }
                });

                // Generate production Storage URL
                const storageUrl = `https://firebasestorage.googleapis.com/v0/b/secretsanta-melb.appspot.com/o/${encodeURIComponent(destination)}?alt=media`;
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

        // Step 3: Create Firestore documents
        await createFirestoreDocuments(pictureUrls);

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
