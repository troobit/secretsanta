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

---

## Troubleshooting Guide

### Unsolvable Pairing Scenarios

When the pairing algorithm cannot find a valid solution, you'll receive an error message in the admin dashboard. This section helps diagnose and resolve common issues.

#### Common Causes

**1. User Conflicted with All Others**
- **Error**: "User 'Name' (userId) is conflicted with all other participants and cannot be paired"
- **Resolution**: Remove at least one conflict from this user so they have potential giftees
- **How**: Use the conflict management UI to remove conflicts one at a time until resolved

**2. Insufficient Available Pairings**
- **Error**: "Unable to generate valid pairings with current conflict constraints. Participants: X. Users with conflicts: ..."
- **Cause**: Too many conflicts create impossible constraint combinations
- **Resolution**: 
  - Review the conflict list shown in the error message
  - Remove some conflicts to create more pairing possibilities
  - Consider adding more participants to increase pairing options

**3. Circular Conflict Chains**
- **Symptom**: Pairing fails even when no single user is fully conflicted
- **Example**: A conflicts with B, B with C, C with D, D with A (makes circular assignment impossible)
- **Resolution**:
  - Identify the conflict chain by reviewing each user's conflicts
  - Break the chain by removing at least one conflict link
  - Test pairing again

#### Performance Considerations

**Maximum Conflict Density**
- **Recommended**: Each user should conflict with < 30% of other participants
- **Limit**: Firestore rules validate up to 10 conflicts per user
- **Performance**: Higher conflict density increases backtracking time

**Participant Count**
- **Optimal**: 5-50 participants
- **Minimum**: 3 non-admin users required
- **Large Groups**: 50+ users may experience slower pairing with high conflict density

#### Troubleshooting Steps

1. **Check Error Message**
   - Note which users are mentioned in the error
   - Look for patterns (e.g., all errors mention the same user)

2. **Review Conflicts in Admin Dashboard**
   - Each user card shows their current conflicts
   - Identify users with many conflicts (> 3)

3. **Remove Strategic Conflicts**
   - Start with users who have the most conflicts
   - Remove one conflict at a time
   - Test pairing after each removal

4. **Test in Emulator First**
   - Use emulator to test conflict configurations safely
   - Verify pairing works before deploying to production

5. **Verify Symmetric Conflicts**
   - System automatically makes conflicts bi-directional
   - If you see asymmetric warnings, they're informational only
   - The system has already reconciled them

#### Edge Cases

**All Users Want Same Gift**
- Not a conflict constraint issue
- Pairing will succeed; wishlist preferences are separate

**User Added Mid-Season**
- Add user, set conflicts if needed
- Re-trigger pairing to include new user
- Previous assignments may change

**User Removed Mid-Season**
- Remove their conflicts first
- Delete their user document
- Re-trigger pairing for remaining users

#### Getting Help

If issues persist after following this guide:
1. Export conflict data (screenshot admin dashboard)
2. Note exact error message
3. Document steps attempted
4. Contact system administrator with details

