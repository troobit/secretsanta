# Setup

## Prerequisites
- Firebase CLI: `npm install -g firebase-tools`
- `firebase login`

## Local Development

**Configure environment:**
```bash
cp .env.example .env
# edit .env values for SITE_TITLE, LOGIN_EMAIL_DOMAIN, FIREBASE_CONFIG
```

**Generate runtime config:**
```bash
cd scripts
npm install
npm run gen-config
```

**Start emulators:**
```bash
firebase emulators:start
```

**Seed test data:**
```bash
cd scripts && npm install && npm run seed
```

**Access:**
- App: http://localhost:5000
- Emulator UI: http://localhost:4000

**Test logins:**
- Users: john, mary, paul / password123
- Admin: admin / admin123

## Production

**Set environment in CI or local shell, then generate config:**
```bash
cd scripts
npm run gen-config
```

```bash
firebase deploy
```

## Secrets and environment storage

- Local: copy `.env.example` to `.env` or `.env.local`; never commit `.env*` or `public/config.js`.
- CI/staging/prod: set env vars (`SITE_TITLE`, `LOGIN_EMAIL_DOMAIN`, `FIREBASE_CONFIG`, `FIREBASE_TARGET_ALIAS`, `FIREBASE_PROJECT_ID`, `STORAGE_BUCKET`, `USE_EMULATORS=false`) in your CI secret store, then run `npm run gen-config` before deploy.
- Firebase runtime config (for functions/hosting defaults):
	```bash
	firebase functions:config:set runtime.site_title="$SITE_TITLE" runtime.login_email_domain="$LOGIN_EMAIL_DOMAIN" runtime.firebase_config="$FIREBASE_CONFIG" runtime.project_id="$FIREBASE_PROJECT_ID" runtime.storage_bucket="$STORAGE_BUCKET"
	# Optional for local functions: export to file
	firebase functions:config:get > .runtimeconfig.json
	```
- Use target aliases when deploying: `FIREBASE_TARGET_ALIAS=staging firebase deploy` (or `prod`).
