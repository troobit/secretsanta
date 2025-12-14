#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function getEnv(name, fallback) {
    const val = process.env[name];
    return val !== undefined ? val : fallback;
}

function parseJsonEnv(name, fallback) {
    const raw = process.env[name];
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error(`Failed to parse ${name} as JSON. Ensure it is a JSON string.`);
        process.exit(1);
    }
}

const SITE_TITLE = getEnv('SITE_TITLE', 'Secret Santa');
const LOGIN_EMAIL_DOMAIN = getEnv('LOGIN_EMAIL_DOMAIN', 'localhost.test');
const USE_EMULATORS = getEnv('USE_EMULATORS', 'false') === 'true';
const FIREBASE_TARGET_ALIAS = getEnv('FIREBASE_TARGET_ALIAS', 'local');
const FIREBASE_CONFIG = parseJsonEnv('FIREBASE_CONFIG', null);

if (!FIREBASE_CONFIG) {
    console.error('FIREBASE_CONFIG is required (JSON string with apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).');
    process.exit(1);
}

const outDir = path.join(__dirname, '..', 'public');
const outFile = path.join(outDir, 'config.js');

const payload = {
    SITE_TITLE,
    LOGIN_EMAIL_DOMAIN,
    USE_EMULATORS,
    FIREBASE_TARGET_ALIAS,
    FIREBASE_CONFIG,
};

const js = `window.RuntimeConfig = ${JSON.stringify(payload, null, 2)};`;

fs.writeFileSync(outFile, js, 'utf8');
console.log(`Generated ${path.relative(process.cwd(), outFile)}`);
