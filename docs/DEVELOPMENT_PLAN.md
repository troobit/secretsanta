# Development Plan: Secret Santa Pairing Constraints

## Project Goal
Deliver conflict-aware Secret Santa pairings with full admin visibility and tooling for managing pairing constraints.

## Requirements & Constraints
- Enforce self-assignment prevention and bilateral conflict avoidance during pairing runs.
- Persist conflicts as part of each Firestore user document and ensure seeding scripts populate representative data.
- Expose admin UI flows to view, add, and remove conflicts with real-time updates.
- Return structured pairing results including counts, warnings, and actionable error messages on failure.
- Provide automated and manual validation for solvable and unsolvable constraint graphs.
- Maintain performance for typical participant counts (<= 50 users) without timeouts in Cloud Functions.

## Plan

### Phase 0: Planning
- [x] (Worker: planner) 0.1 (ENHANCE) Publish development plan for constraint-based pairing scope.

### Phase 1: Data Model & Seed Updates
 - [x] (Worker: 7c2e9a) 1.1 (ENHANCE) Introduce conflicts array to Firestore user model across docs and runtime defaults.
  - [x] 1.1.a (Worker: 1.1.a) Update Firestore data model documentation and any schema helpers to include conflicts.
  - [x] 1.1.b (Worker: 1.1.b) Ensure security rules tolerate missing or empty conflicts arrays safely.
  - [x] (Worker: 1.1.c) 1.1.c Fix hasValidConflicts() in firestore.rules to validate all array elements are strings, not just first element.
- [x] (Worker: 7c2e9a) 1.2 (ENHANCE) Refresh seeding assets with representative conflict data.
  - [x] (Worker: 1.2.a) Extend scripts/seed-emulators.js to write conflicts arrays and handle mutual entries.
  - [x] (Worker: 1.2.b) Update scripts/users.json (and examples) with sample conflicts for admin testing.
- [ ] 1.3 **VALIDATION CHECKPOINT:** Confirm emulator seeding produces conflicts entries for all non-admin users without runtime errors.

### Phase 2: Cloud Function Implementation
- [x] (Worker: worker-2.1) 2.1 (ENHANCE) Load conflicts data in functions/main.py triggerSecretSantaPairing.
  - [x] (Worker: worker-2.1) 2.1.a Normalize missing conflicts fields to empty arrays at load time.
  - [x] (Worker: worker-2.1) 2.1.b Build in-memory conflict lookup supporting symmetric checks.
- [ ] 2.2 (ENHANCE) Validate constraint graph before pairing begins.
  - [ ] 2.2.a Detect unsatisfied prerequisites (e.g., single participant, fully conflicted users) and prepare descriptive errors.
  - [ ] 2.2.b Guard against asymmetric conflict declarations by reconciling both directions.
- [ ] 2.3 (ENHANCE) Implement backtracking pairing algorithm with constraint awareness.
  - [ ] 2.3.a Shuffle candidate giftees deterministically (seeded randomness) for fairness and reproducibility.
  - [ ] 2.3.b Backtrack on conflict or self-assignment violations and retry until solution or exhaustion.
- [ ] 2.4 (ENHANCE) Emit structured pairing results and error details.
  - [ ] 2.4.a Populate pairingsCount, timestamp, warnings, and errors in function response.
  - [ ] 2.4.b Surface unsolvable constraint details in error payload for UI display.
- [ ] 2.5 **VALIDATION CHECKPOINT:** Achieve green automated tests covering solvable and unsolvable conflict scenarios for triggerSecretSantaPairing.

### Phase 3: Admin Dashboard Enhancements
- [ ] 3.1 (ENHANCE) Display current conflicts within admin dashboard.
  - [ ] 3.1.a Add UI section summarizing conflicts per user with clear labels.
  - [ ] 3.1.b Wire real-time Firestore listeners to keep conflict data synchronized.
- [ ] 3.2 (ENHANCE) Allow admins to manage conflicts interactively.
  - [ ] 3.2.a Implement add-conflict flow ensuring bi-directional writes and validation of user ids.
  - [ ] 3.2.b Provide remove-conflict controls with confirmation and symmetric cleanup.
  - [ ] 3.2.c Handle Firestore write errors and display lightweight feedback.
- [ ] 3.3 (ENHANCE) Upgrade pairing result presentation.
  - [ ] 3.3.a Render pairing status, pairingsCount, warnings, and errors with clear styling.
  - [ ] 3.3.b Log notable warnings client-side for debugging while avoiding sensitive data exposure.
- [ ] 3.4 **VALIDATION CHECKPOINT:** Smoke test admin UI to confirm conflict edits persist and pairing outcomes display correctly.

### Phase 4: Testing & Quality Assurance
- [ ] 4.1 (ENHANCE) Build unit test coverage for pairing logic in functions/test_main.py.
  - [ ] 4.1.a Verify self-assignment prevention across varied participant counts.
  - [ ] 4.1.b Validate bilateral conflict enforcement and absence of forbidden pairs.
  - [ ] 4.1.c Confirm backtracking success by solving multi-path scenarios.
  - [ ] 4.1.d Assert unsolvable graphs return structured errors without partial writes.
- [ ] 4.2 (ENHANCE) Document edge cases and troubleshooting guidance for admins.
  - [ ] 4.2.a Extend docs/PAIRING_CONSTRAINTS.md with resolution steps for unsolvable runs.
  - [ ] 4.2.b Note performance considerations and recommended maximum conflict density.
- [ ] 4.3 **VALIDATION CHECKPOINT:** Execute manual end-to-end emulator run covering success and failure paths, recording outcomes.

## Success Criteria (Measurable)

- [ ] Conflicts arrays exist for every non-admin user in emulator and production seed datasets.
- [ ] triggerSecretSantaPairing returns valid pairings respecting all conflicts for at least three randomized datasets of 20 users.
- [ ] Function responds with clear error payload when provided an unsolvable constraint graph, and admin UI surfaces the message verbatim.
- [ ] Admin dashboard allows creating and removing conflicts with changes reflected in Firestore within two seconds.
- [ ] Automated unit tests covering conflict scenarios execute successfully in CI and locally.
- [ ] Manual emulator test log confirms successful and failed runs with no console errors in admin UI.

## Agent Log

- **PLANNER:** Task 0.1: Complete. Authored phased development plan for pairing constraints delivery.
- **WORKER:** Task 1.1.a: Updated DATABASE_SCHEMA.md to include conflicts field in user model.
- **REVIEWER:** Task 1.1.a: Pass. conflicts field properly documented in DATABASE_SCHEMA.md with correct type (array of strings), optional status, default value, and matching documentation style.
- **WORKER:** Task 1.1.b: Updated firestore.rules to validate conflicts field (missing/empty/array of strings) and allow admin updates.
- **REVIEWER:** Task 1.1.b: Fail. Security rules handle missing and empty conflicts arrays correctly, but validation only checks first element `[0]` instead of all elements. Mixed-type arrays would pass validation. Need complete array validation.
- **WORKER:** Task 1.1.c: Fixed hasValidConflicts() in firestore.rules to validate all array elements are strings using recursive helper functions.
- **REVIEWER:** Task 1.1.c: Pass. hasValidConflicts() now accepts missing/empty conflicts, uses recursive helpers to ensure every element in non-empty arrays is a string, and follows Firestore rules syntax without loops.
- **WORKER:** Tasks 2.1/2.1.a/2.1.b (Complete): Normalized conflicts to empty arrays when loading users in triggerSecretSantaPairing and built symmetric in-memory conflict lookup to support bilateral checks.
- **REVIEWER:** Task 2.1: Pass. Conflicts normalize to empty arrays and symmetric lookup added in functions/main.py; plan status and log updates are consistent.
- **WORKER:** Task 1.2.b: Added sample conflicts arrays to users.json and users.example.json (John↔Mary, Paul↔Sudi).
- **WORKER:** Task 1.1: Complete. Normalized conflicts defaults for production deploys in scripts/deploy-users-production.js.
