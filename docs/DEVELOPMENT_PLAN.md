# Development Plan - Front-End Fixes

## Goal
Fix three specific front-end issues: Admin permission errors, CSS persistence after logout, and page flash on load (FOUC).

## Phase 1: Admin Dashboard Permission Error
**Severity:** High
**Root Cause:** `x-show` hides the dashboard but executes `userDashboard()` logic; admins lack permissions/data for this component.
**Fix:** Prevent component initialization using `x-if` instead of `x-show`.

- [x] **Update Dashboard Conditional Rendering**
  - **File:** `public/index.html`
  - **Action:** Wrap the user dashboard `div` (currently using `x-show="user && !isAdmin"`) in a `<template x-if="user && !isAdmin">` tag and remove the `x-show` attribute.
  - **Success Criteria:** Login as admin does not trigger "Missing or insufficient permissions" error in console.

- [x] **(FIX) Remove Obsolete Lock Status UI**
  - **File:** `public/index.html`
  - **Action:** Remove lines 182-188 (the "Pairing Status" section with `isLocked` and `lockTimeFormatted` references). Admin should only see users list and trigger button.
  - **Success Criteria:** No Alpine.js "isLocked is not defined" or "lockTimeFormatted is not defined" errors in console.

- [x] **(FIX) Fix Firestore Rules - Remove isLocked() Call**
  - **File:** `firestore.rules`
  - **Action:** On line 25, remove the `&& (!isLocked() || onlyWishlistChanged())` condition. The update rule should be: `allow update: if request.auth != null && request.auth.uid == userId && onlyWishlistChanged();`
  - **Rationale:** The `isLocked()` function doesn't exist and the lock mechanism was removed. Users should only be able to update their wishlist field.
  - **Success Criteria:** Admin can query users collection without permission errors.

- [x] **(FIX) Fix Admin Dashboard Conditional Rendering**
  - **File:** `public/index.html`
  - **Action:** Change line 161 from `<div x-show="user && isAdmin" x-data="adminDashboard()"` to `<template x-if="user && isAdmin"><div x-data="adminDashboard()"` and add closing `</div></template>` at end of admin section (before line 216).
  - **Rationale:** `x-show` hides elements via CSS but still executes the component logic; `x-if` conditionally renders the element only when true, preventing initialization issues.
  - **Success Criteria:** Admin dashboard component only initializes when user is admin; no console errors on initialization.

- [x] **(FIX) Add Admin Read Permission to Firestore Rules**
  - **File:** `firestore.rules`
  - **Action:** Modify the users collection read rule to allow admins to read all users, and non-admins to only read themselves. Change: `allow read: if request.auth != null && (isAdmin() || request.auth.uid == userId);`
  - **Rationale:** Admins need to query all non-admin users to display the users list. Current rule allows any authenticated user to read any user document, which may be overly permissive and causing Firestore security issues.
  - **Success Criteria:** Admin can successfully load and display the users list without Firebase permission errors.

- [x] **(FIX) Pairing Result Payload**
  - **File:** `functions/main.py`, `public/js/admin-dashboard-component.js`
  - **Action:** Ensure the Cloud Function returns a response object with `pairingsCount` (e.g., number of users paired) and update the admin dashboard to handle missing/undefined data defensively.
  - **Success Criteria:** Triggering pairing no longer throws `Cannot read properties of null (reading 'pairingsCount')`; admin sees a success/failure message without console errors.

## Phase 2: CSS Persistence After Logout
**Severity:** Medium
**Root Cause:** `updateTheme()` in `auth-component.js` adds custom CSS but fails to remove the link element upon logout.
**Fix:** Modify `updateTheme()` to remove the CSS link when the user is null.

 - [x] **Clear Custom CSS on Logout**
  - **File:** `public/js/auth-component.js`
  - **Action:** Update `updateTheme()` to check if `this.user` is null; if so, find and remove the `#user-custom-css` element.
  - **Success Criteria:** Logging out removes the custom user stylesheet from the `<head>`.

## Phase 3: Page Flash on Load (FOUC)
**Severity:** Low
**Root Cause:** Missing CSS rule for `[x-cloak]` attribute, which Alpine.js uses to hide uninitialized content.
**Fix:** Add the standard `x-cloak` style definition to the document head.

- [x] **Add x-cloak Style**
  - **File:** `public/index.html`
  - **Action:** Add `<style>[x-cloak] { display: none !important; }</style>` to the `<head>` section.
  - **Success Criteria:** Reloading the page while logged in shows no flash of unstyled/hidden content.


## Agent Log

- **WORKER:** Phase 1 Complete: Wrapped user dashboard in `<template x-if>` to prevent component initialization for admin users.
- **WORKER:** (FIX) Fixed variable name conflict in admin users list (`user` → `usr` in x-for loop) that caused "img is not defined" error.
- **WORKER:** (FIX) Fixed syntax error in `admin-dashboard-component.js` (duplicate destroy method declaration).
- **WORKER:** (FIX) Fixed incorrect `:alt` attributes in user dashboard images.
- **REVIEWER:** Phase 1 Review: **FAIL** - Admin dashboard still broken with multiple critical issues:
  1. Alpine.js errors: `isLocked` and `lockTimeFormatted` variables referenced in HTML but not defined in component
  2. Firestore permission error: Rules reference undefined `isLocked()` function on line 25
  3. Admin cannot see users list or pairing status due to these blocking errors
- **WORKER:** Completed FIX tasks: Removed obsolete lock status UI from `index.html`, fixed `firestore.rules` by removing undefined `isLocked()` call.

- **REVIEWER:** Phase 1 Follow-up Review: **FAIL** - Admin dashboard still has initialization and Firestore permission issues:
  1. **Critical:** Line 161 in `index.html` still uses `x-show="user && isAdmin"` instead of `<template x-if="user && isAdmin">`. The component executes initialization logic immediately even when hidden, and Alpine components initialized with `x-show` can cause timing issues.
  2. **Critical:** Firestore permission denied when admin queries users collection. Current rule `allow read: if request.auth != null;` allows any authenticated user to read, but `where('isAdmin', '!=', true)` queries may need explicit admin verification. The `isAdmin()` helper exists but is not being used in the read rule for admin-specific access.
  3. Admin logs in but cannot retrieve user list due to Firebase permission errors.
- **WORKER:** Fixed admin dashboard conditional rendering: wrapped admin section with `<template x-if="user && isAdmin">` instead of `x-show` to prevent premature component initialization.
- **REVIEWER:** (FIX) Fix Admin Dashboard Conditional Rendering: **FAIL** - Missing closing `</div>` for the admin dashboard container before `</template>` in `public/index.html` (admin section near the pairing confirmation modal). HTML is unbalanced and could break Alpine initialization/rendering for the admin view.
- **WORKER:** Fixed missing closing `</div>` for admin dashboard container in `public/index.html`.
- **WORKER:** Updated Firestore rules: admins can read all users, non-admins can only read their own document.
- **WORKER:** Completed Pairing Result Payload: Function returns `pairingsCount`; dashboard handles missing data safely.
- **WORKER:** Cleared custom CSS on logout: `updateTheme()` removes `#user-custom-css` when user is null.
- **WORKER:** Phase 3 Complete: Added `[x-cloak]` style rule to prevent FOUC during Alpine.js initialization.