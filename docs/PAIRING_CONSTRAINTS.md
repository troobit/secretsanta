# Pairing Constraints - Requirements & Design

## Phase Overview
This document guides development of admin pairing constraint features using a spec-driven workflow. Constraints prevent specific user pairs (e.g., user 'a' cannot be paired with 'b' or 'c') in Secret Santa assignments.

---

## Phase 1: ANALYZE

### Requirements (EARS Notation)

**UB-001**: `THE SYSTEM SHALL prevent a user from being assigned as giftee to themselves.`

**EB-001**: `WHEN an admin triggers pairing, THE SYSTEM SHALL respect predefined conflict constraints (no pairing between conflicted users).`

**EB-002**: `WHEN a conflict constraint exists between user A and user B, THE SYSTEM SHALL ensure A is not assigned B as giftee and B is not assigned A as giftee.`

**SB-001**: `WHILE a valid pairing exists that satisfies all constraints, THE SYSTEM SHALL find and apply it.`

**UB-002**: `IF no valid pairing can be found (unsolvable constraint graph), THE SYSTEM SHALL return an error with a clear message identifying the conflicted users.`

**OB-001**: `WHERE admin views the pairing result, THE SYSTEM SHALL display assignment summary and any warnings about constraint violations or near-misses.`

### Constraints & Dependencies

- **Data Model**: Conflict constraints must be stored in Firestore (user-to-user relationships).
- **Algorithm**: Backtracking or bipartite matching approach.
- **Admin UI**: Display current conflicts; add/remove conflict UI.
- **Error Handling**: Graceful fallback when no solution exists.

### Confidence Score
**82%** — Clear requirements, well-understood algorithm space, straightforward data model. Main unknown: optimal performance for 20+ users with complex constraints.

---

## Phase 2: DESIGN

### Technical Architecture

#### Data Model (Firestore)
```
users/[userId]
  ├── name: string
  ├── isAdmin: boolean
  ├── conflicts: [string] // Array of userIds this user cannot be paired with
  └── gifteeId: string (populated after pairing)
```

#### Algorithm: Backtracking
1. Build conflict graph from Firestore.
2. Shuffle non-admin users.
3. Recursively assign giftees, backtrack if conflict or self-assignment detected.
4. Return pairings or error if no solution.

#### Cloud Function Changes (`functions/main.py`)
- Add conflict validation before pairing.
- Return enhanced payload: `{ pairingsCount, timestamp, warnings[], errors[] }`

#### Admin Dashboard Changes (`public/js/admin-dashboard-component.js`)
- Display current conflicts (new section).
- Add conflict management UI (buttons to add/remove).
- Show pairing result with warnings.

### Error Handling Matrix
| Error | Cause | Response |
|-------|-------|----------|
| No valid pairing | Constraint graph unsolvable | Return error list of conflicted users |
| Insufficient users | < 2 non-admin users | Return error |
| Permission denied | Non-admin triggered | Return permission error |

### Unit Testing Strategy
- Test self-assignment prevention.
- Test conflict respect (A-B, B-A both prevented).
- Test backtracking (multiple valid solutions).
- Test unsolvable graphs (circular conflicts).
- Test edge cases (1 user, all users conflicted).

---

## Phase 3: IMPLEMENT

### Implementation Plan (`tasks.md`)

**Task 1**: Add `conflicts` field to Firestore user documents.
**Task 2**: Update Cloud Function to load and validate conflicts.
**Task 3**: Implement backtracking pairing algorithm.
**Task 4**: Add conflict UI to admin dashboard (view/add/remove).
**Task 5**: Update pairing result display with warnings/errors.
**Task 6**: Write comprehensive unit tests.
**Task 7**: Manual end-to-end testing in emulator.

---

## Phase 4-6: VALIDATE, REFLECT, HANDOFF

See `tasks.md` for detailed execution log and validation results.

