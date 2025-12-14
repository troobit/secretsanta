# Development Plan: Secret Santa Environment Variables

## Project Goal
Enable environment-based configuration for the Secret Santa app (titles, deployment targets, Firebase settings) while preventing accidental exposure of sensitive values in the repository.

## Requirements & Constraints
- Keep Firebase credentials and project identifiers out of version control; rely on env/config values per environment.
- Support environment-specific branding titles (e.g., Mantel Road, Barlyn Rd) without code changes.
- Work across local emulators, staging, and production deployments.
- Provide a repeatable way to inject runtime config into the frontend without baking secrets into static assets.
- Document setup steps for collaborators to run locally with minimal friction.

## Plan

### Phase 1: Discovery & Inventory
- [x] (Worker: copilot) 1.1 Catalogue current configuration touchpoints (frontend `firebase/init.js`, admin function init, deploy scripts) and list required env vars (titles, Firebase API/config, deployment targets).
- [x] (Worker: copilot) 1.2 Identify existing secret exposures in the repo (Firebase config, project IDs, API keys) and determine mitigation (runtime config, Firebase config:set, .env.gitignore). **VALIDATION CHECKPOINT:** verify inventory covers frontend, functions, and scripts.

### Phase 2: Environment Strategy Design
- [x] (Worker: copilot) 2.1 Define environment matrix (local emulator, staging, production) with required variables: site title, Firebase config bundle, deploy target identifiers.

#### Environment Matrix (Required Vars)

- Local (Emulators)
  - `SITE_TITLE`: non-sensitive title for local (e.g., "Secret Santa – Local").
  - `FIREBASE_CONFIG`: bundle with `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.
  - `USE_EMULATORS`: `true` (frontend/services switch to emulator hosts/ports).
  - `FIREBASE_TARGET_ALIAS`: `local` or dev alias used by scripts.

- Staging
  - `SITE_TITLE`: environment-specific title (e.g., "Secret Santa – Staging").
  - `FIREBASE_CONFIG`: staging project bundle (same keys as above).
  - `FIREBASE_TARGET_ALIAS`: `staging` (deploy/select this alias).

- Production
  - `SITE_TITLE`: brand title (e.g., "Mantel Road" / "Barlyn Rd").
  - `FIREBASE_CONFIG`: production project bundle (same keys as above).
  - `FIREBASE_TARGET_ALIAS`: `prod` (deploy/select this alias).

Notes
- `LOGIN_EMAIL_DOMAIN` is configurable per environment but not strictly required for 2.1. Include it in `.env` when implementing 3.x.
- `FIREBASE_PROJECT_ID` and `STORAGE_BUCKET` can be derived from `FIREBASE_CONFIG` and are used by scripts/functions if needed.

- [x] (Worker: b6e9d2) 2.2 Choose runtime config delivery for frontend (e.g., generated `config.js` from env on deploy or Firebase hosting config) ensuring nothing sensitive is committed. **VALIDATION CHECKPOINT:** confirm strategy supports per-environment titles without rebuilding core app.
- [x] (Worker: b6e9d2) 2.3 Specify storage of secrets using provider tooling (Firebase `functions:config:set` or hosting config) and local `.env.local` with `.env.example` for onboarding.

### Phase 3: Implementation
- [x] 3.1 Add `.env.example` and gitignore rules for `.env*`; document required keys and default values for emulators.
- [x] 3.2 Implement build/deploy script to emit `public/config.js` (or equivalent) from env values for hosting; reference it in `index.html` and components for titles and Firebase init params.
- [x] 3.3 Update frontend to read site titles and Firebase config from generated runtime config (no hardcoded IDs/API keys); ensure emulator toggles still function.
- [x] 3.4 Integrate deployment targets: parameterize Firebase project selection in scripts (seed/deploy) via env, and document `firebase use` / target aliases.
- [x] 3.5 Add docs in `docs/SETUP.md` for configuring env vars (local + CI), including guidance to set Firebase runtime config instead of committing secrets. **VALIDATION CHECKPOINT:** run through fresh clone setup to ensure steps work.

### Phase 4: Validation & Hardening
- [x] (Worker: b6e9d2) 4.1 **VALIDATION CHECKPOINT:** `git grep` / scan to confirm no Firebase project IDs/API keys remain in tracked files; verify `.env` and generated config files are ignored.
- [ ] 4.2 Smoke test against emulators using env-driven config: ensure title renders per env and app loads Firebase successfully.
- [ ] 4.3 Document fallback/alerts for missing env vars (friendly error in frontend load path) and add quick checklist before deploy.

## Success Criteria (Measurable)
- [ ] Site title is driven by an environment value and changes without code edits.
- [ ] Firebase config/API keys are not present in tracked files; `.env.example` exists and `.env*` ignored.
- [ ] Deploy scripts/selectors use env-driven project/target values for staging vs production.
- [ ] Fresh clone can run against emulators using documented env setup without manual key insertion.
- [ ] Validation scans confirm no hardcoded secrets after changes.

## Agent Log
- **WORKER (copilot):** Task 1.1: Complete. Touchpoints found: frontend config from Firebase hosting `/__/firebase/init.js` plus local `js/firebase-init.js` emulator switch; hardcoded site titles in `public/index.html`; login email domain in `auth-component.js`; dashboards depend on global Firebase objects; Cloud Function init via `initialize_app()`; deploy/seeding scripts hardcode `projectId` and `storageBucket` (`<redacted-project-id>`) and run against emulators; firebase.json hosts config/emulator ports. Initial env list: SITE_TITLE (page title/hero headline), LOGIN_EMAIL_DOMAIN, FIREBASE_CONFIG bundle (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId), FIREBASE_PROJECT_ID/STORAGE_BUCKET for admin scripts and functions, DEPLOY_TARGET/ALIAS for staging/prod selection, optional PLACEHOLDER_IMAGE_BASE. Need runtime injection for frontend config (config.js) to avoid tracked secrets.
- **WORKER (copilot):** Task 1.2: Complete. Secret exposure inventory (frontend/functions/scripts validated): frontend hardcodes login email domain `rtob.dev` in `public/js/auth-component.js`; storage rules pin admin email `admin@rtob.dev`; Cloud Function comment/logic assumes same domain; seed/deploy scripts embed production identifiers `projectId`/`storageBucket` (`<redacted-project-id>`) and Storage URLs; `.firebaserc` tracks default project. Mitigation plan: move domain, project ID, bucket, and storage URL base to env/config; generate runtime Firebase config and title; use `.env` (ignored) plus `.env.example`; parameterize scripts and storage rules via env or Firebase config values.
- **WORKER (copilot):** Task 2.1: Complete. Defined environment matrix with required vars for local, staging, and production in `docs/DEVELOPMENT_PLAN.md`.
- **WORKER:** Task 3.1: Complete. Added `.gitignore` to exclude `.env*` and generated `public/config.js`; normalized `.env.example` with all required keys (SITE_TITLE, LOGIN_EMAIL_DOMAIN, FIREBASE_CONFIG, USE_EMULATORS, FIREBASE_TARGET_ALIAS, FIREBASE_PROJECT_ID, STORAGE_BUCKET).
- **WORKER:** Task 3.2: Complete. Created `scripts/generate-config.js` to emit `public/config.js` from env; added `gen-config` npm script; updated `index.html` to load `/config.js` and apply SITE_TITLE to page title and hero.
- **WORKER:** Task 3.3: Complete. Updated `firebase-init.js` to initialize Firebase from `RuntimeConfig.FIREBASE_CONFIG` and apply emulator toggles; updated `auth-component.js` to use `LOGIN_EMAIL_DOMAIN` from `RuntimeConfig`.
- **WORKER:** Task 3.4: Complete. Parameterized `seed-emulators.js` and `deploy-users-production.js` to use `FIREBASE_PROJECT_ID` and `STORAGE_BUCKET` from env (via dotenv); added dotenv dependency; updated `.env.example` with project/bucket values.
- **WORKER:** Task 3.5: Complete. Updated `docs/SETUP.md` with steps to configure env vars and generate runtime config for local and production.
- **WORKER (b6e9d2):** Task 2.2: Complete. Selected env-driven runtime delivery via [scripts/generate-config.js](scripts/generate-config.js) emitting ignored [public/config.js](public/config.js); confirmed [public/index.html](public/index.html), [public/js/firebase-init.js](public/js/firebase-init.js), and [public/js/auth-component.js](public/js/auth-component.js) consume `RuntimeConfig` so titles and Firebase settings swap per environment without rebuild.
- **WORKER (b6e9d2):** Task 4.1: Complete. Removed project ID fallbacks from [scripts/deploy-users-production.js](scripts/deploy-users-production.js) and [scripts/seed-emulators.js](scripts/seed-emulators.js); sanitized [.firebaserc](.firebaserc); redacted old project IDs in [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md); verified `.env*` and [public/config.js](public/config.js) are ignored via [.gitignore](.gitignore) and scans show no Firebase project IDs/API keys remaining.
