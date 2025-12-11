# Development Plan - Front-End Fixes

## Goal
Fix three specific front-end issues: Admin permission errors, CSS persistence after logout, and page flash on load (FOUC).

## Phase 1: Admin Dashboard Permission Error
**Severity:** High
**Root Cause:** `x-show` hides the dashboard but executes `userDashboard()` logic; admins lack permissions/data for this component.
**Fix:** Prevent component initialization using `x-if` instead of `x-show`.

- [ ] **Update Dashboard Conditional Rendering**
  - **File:** `public/index.html`
  - **Action:** Wrap the user dashboard `div` (currently using `x-show="user && !isAdmin"`) in a `<template x-if="user && !isAdmin">` tag and remove the `x-show` attribute.
  - **Success Criteria:** Login as admin does not trigger "Missing or insufficient permissions" error in console.

## Phase 2: CSS Persistence After Logout
**Severity:** Medium
**Root Cause:** `updateTheme()` in `auth-component.js` adds custom CSS but fails to remove the link element upon logout.
**Fix:** Modify `updateTheme()` to remove the CSS link when the user is null.

- [ ] **Clear Custom CSS on Logout**
  - **File:** `public/js/auth-component.js`
  - **Action:** Update `updateTheme()` to check if `this.user` is null; if so, find and remove the `#user-custom-css` element.
  - **Success Criteria:** Logging out removes the custom user stylesheet from the `<head>`.

## Phase 3: Page Flash on Load (FOUC)
**Severity:** Low
**Root Cause:** Missing CSS rule for `[x-cloak]` attribute, which Alpine.js uses to hide uninitialized content.
**Fix:** Add the standard `x-cloak` style definition to the document head.

- [ ] **Add x-cloak Style**
  - **File:** `public/index.html`
  - **Action:** Add `<style>[x-cloak] { display: none !important; }</style>` to the `<head>` section.
  - **Success Criteria:** Reloading the page while logged in shows no flash of unstyled/hidden content.
