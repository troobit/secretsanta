# Pairing Constraints - Implementation Tasks

## Overview
Tracked execution of constraint-based pairing feature using spec-driven workflow.

---

## Task 1: Add `conflicts` Field to Firestore User Documents

**Status**: NOT STARTED  
**Dependencies**: None  
**Effort**: 30 min

**Description**:
Add `conflicts: [string]` array field to each user document in Firestore. This array contains userIds that this user cannot be paired with.

**Expected Outcome**:
- Firestore schema updated.
- Seed script (`scripts/seed-emulators.js`) includes sample conflicts.
- Admin can view conflicts in dashboard.

**Success Criteria**:
- [ ] User documents have `conflicts` field (empty or populated).
- [ ] Emulator seed data includes test conflicts.

---

## Task 2: Update Cloud Function to Load and Validate Conflicts

**Status**: NOT STARTED  
**Dependencies**: Task 1  
**Effort**: 1 hour

**Description**:
Modify `functions/main.py::triggerSecretSantaPairing()` to:
1. Load conflict constraints from Firestore.
2. Validate constraint graph before pairing attempt.
3. Return error if constraints are unsolvable.

**Expected Outcome**:
Enhanced Cloud Function that respects conflict constraints.

**Success Criteria**:
- [ ] Function loads `conflicts` array for all users.
- [ ] Function detects unsolvable constraints and returns error.
- [ ] Function passes tests with conflict-heavy scenarios.

---

## Task 3: Implement Backtracking Pairing Algorithm

**Status**: NOT STARTED  
**Dependencies**: Task 2  
**Effort**: 1.5 hours

**Description**:
Implement backtracking algorithm in `functions/main.py` that:
1. Shuffles users.
2. Recursively assigns giftees while respecting self-assignment and conflict constraints.
3. Backtracks if constraint violated.
4. Returns pairings or error.

**Expected Outcome**:
Robust pairing algorithm with full constraint support.

**Success Criteria**:
- [ ] Algorithm prevents self-assignment.
- [ ] Algorithm respects bi-directional conflicts (A-B and B-A).
- [ ] Algorithm finds valid solutions when they exist.
- [ ] Algorithm backtracks and retries intelligently.
- [ ] Unit tests cover edge cases.

---

## Task 4: Add Conflict UI to Admin Dashboard

**Status**: NOT STARTED  
**Dependencies**: Task 1  
**Effort**: 1.5 hours

**Description**:
Extend `public/js/admin-dashboard-component.js` to:
1. Display current conflicts in a table/list.
2. Add UI to manage conflicts (add/remove).
3. Integrate with Firestore real-time listeners.

**Expected Outcome**:
Admin can view and manage user conflicts from dashboard.

**Success Criteria**:
- [ ] Conflicts displayed in dashboard.
- [ ] Admin can add a conflict (user A ↔ user B).
- [ ] Admin can remove a conflict.
- [ ] Changes persist to Firestore.

---

## Task 5: Update Pairing Result Display

**Status**: NOT STARTED  
**Dependencies**: Task 3  
**Effort**: 1 hour

**Description**:
Enhance pairing result display in `public/js/admin-dashboard-component.js` to show:
1. Success/failure status.
2. Number of pairings completed.
3. Any warnings or constraint violations.
4. Clear error messages if pairing failed.

**Expected Outcome**:
Transparent feedback to admin on pairing outcome.

**Success Criteria**:
- [ ] Result display shows pairingsCount.
- [ ] Result display shows any warnings.
- [ ] Error messages are clear and actionable.

---

## Task 6: Write Comprehensive Unit Tests

**Status**: NOT STARTED  
**Dependencies**: Task 3  
**Effort**: 2 hours

**Description**:
Create unit tests in `functions/test_main.py` covering:
1. Self-assignment prevention.
2. Conflict respect (A↔B both prevented).
3. Backtracking (multiple solutions).
4. Unsolvable graphs (circular conflicts).
5. Edge cases (1 user, all conflicted).

**Expected Outcome**:
Full test coverage for pairing algorithm.

**Success Criteria**:
- [ ] All test cases pass.
- [ ] Edge cases documented and tested.
- [ ] Test output is clear and actionable.

---

## Task 7: Manual End-to-End Testing

**Status**: NOT STARTED  
**Dependencies**: All (1-6)  
**Effort**: 1.5 hours

**Description**:
Test full workflow in Firebase emulator:
1. Create test users with conflicts.
2. Trigger pairing via admin dashboard.
3. Verify assignments respect constraints.
4. Test error scenarios (unsolvable).
5. Verify result display.

**Expected Outcome**:
Full feature validated in realistic environment.

**Success Criteria**:
- [ ] Pairing respects all conflicts.
- [ ] Error handling works as expected.
- [ ] Admin UI is responsive and intuitive.
- [ ] No console errors.

---

## Execution Log

### [PENDING] - Phase 1 Analysis
**Objective**: Establish requirements and design for constraint-based pairing.  
**Status**: Complete (see `PAIRING_CONSTRAINTS.md`)  
**Validation**: Requirements documented in EARS notation; confidence score 82%.  

### [PENDING] - Phase 3 Implementation
**Objective**: Implement tasks 1-7 in sequence.  
**Status**: Ready to begin.  

