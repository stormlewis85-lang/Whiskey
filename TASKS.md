# TASKS.md - MyWhiskeyPedia

> PM-owned task tracker. Single source of truth for project state.
> Updated by PM Agent after every task completion.

---

## Active Tasks

### [AUDIT-001] End-to-End Feature Walkthrough — COMPLETE
- **Scope:** Standard
- **Assigned:** Developer, Test
- **Priority:** P1
- **Status:** COMPLETE — findings logged in AUDIT-001-FINDINGS.md
- **Summary:** 3 critical (missing DB tables for flights/blind-tastings/follows), 1 high (auth token leak), 2 medium (API catch-all, no export endpoint). 36+ endpoints passing.

### [AUDIT-002] Auth & Session Security Review — COMPLETE
- **Scope:** Standard
- **Assigned:** Security, Developer
- **Priority:** P1
- **Status:** COMPLETE — findings logged in AUDIT-002-FINDINGS.md
- **Summary:** 0 critical, 2 high (token stored plaintext, token in response body), 3 medium (token expiry gap, session fixation, logout token invalidation), 3 low, 2 info. 4 issues fixed inline (M-1, M-2, M-3, L-3). Session token bug identified as M-3 (logout didn't invalidate auth token) — now fixed. 2 high-priority items flagged for pre-launch.

### [AUDIT-003] Database & API Integrity Check
- **Scope:** Standard
- **Assigned:** Data, Developer
- **Priority:** P1
- **Description:** Verify database schema matches ORM types. Test all API endpoints return correct data shapes. Check for missing error handling, unvalidated inputs, and SQL injection vectors. Verify migrations are clean. Test with empty collection, single bottle, and 50+ bottle collection.
- **Acceptance Criteria:**
  - API endpoints tested with valid and invalid inputs
  - No unhandled errors or 500s from expected user actions
  - Schema/ORM type alignment confirmed
- **Gate:** `npm run build` passes, all endpoints return expected responses, no TypeScript type mismatches at API boundary

### [AUDIT-004] Mobile UI Completeness Audit
- **Scope:** Standard
- **Assigned:** UI/UX, Test
- **Priority:** P2
- **Description:** Verify every page renders correctly on mobile (375px, 414px). Check: no horizontal scroll, touch targets >= 44px, modals scrollable and dismissible, bottom nav doesn't overlap content, all new components (ProfileMenu, activity skeletons, empty states) display correctly. Test on actual mobile browser if possible.
- **Acceptance Criteria:**
  - Every page screenshot/verified at 375px
  - No layout breaks, overlaps, or inaccessible content
  - ProfileMenu items all navigate correctly
- **Gate:** All pages render without layout issues at 375px viewport

### [AUDIT-005] Desktop Regression Check
- **Scope:** Quick
- **Assigned:** Test
- **Priority:** P2
- **Description:** Verify the mobile-first redesign didn't break desktop layouts. Check: Header shows on desktop (md+), BottomNav hidden on desktop, Dashboard charts render at full width, collection grid adapts, profile page shows desktop layout, all modals sized correctly.
- **Acceptance Criteria:**
  - Desktop layout intact at 1280px+
  - No mobile-only components leaking into desktop view
- **Gate:** All pages render correctly at 1280px

### [AUDIT-006] Error Handling & Edge Cases
- **Scope:** Standard
- **Assigned:** Developer, Test
- **Priority:** P2
- **Description:** Test graceful degradation: what happens with no network? Empty collection? Malformed review data? Invalid bottle ID in URL? Expired JWT? Double-submit on forms? Very long text inputs? Special characters in bottle names? Ensure loading states, error states, and empty states all render.
- **Acceptance Criteria:**
  - No white screens or unhandled exceptions
  - All error states show user-friendly messages
  - Loading skeletons display during data fetches
- **Gate:** No uncaught exceptions in any tested scenario

### [AUDIT-007] Performance Baseline
- **Scope:** Quick
- **Assigned:** Developer
- **Priority:** P3
- **Description:** Measure initial load time, time-to-interactive, and largest contentful paint on mobile. Check bundle size. Verify lazy-loaded components (TastingMode, TastingSession) don't block initial render. Identify any obvious performance bottlenecks (large images, unoptimized queries, missing pagination).
- **Acceptance Criteria:**
  - Performance metrics documented
  - Any critical bottlenecks flagged
- **Gate:** No blocking performance issues for beta launch

### [AUDIT-008] Pre-Beta Cleanup
- **Scope:** Quick
- **Assigned:** Developer
- **Priority:** P3
- **Description:** Remove or gate mock data (Drops page mock stores, any remaining mock activity data). Check for console.log statements in production code. Verify environment variables are properly configured for production. Remove unused imports and dead code flagged during audit.
- **Acceptance Criteria:**
  - No mock data visible to beta users (or clearly labeled as demo)
  - No console.log in production paths
  - Clean build with no new warnings
- **Gate:** `npm run build` clean, no mock data in production paths

---

## Queue

_(Empty — all fix tasks completed)_

---

## Completed Tasks

### [FIX-001] Create Missing Database Tables
- **Completed:** 2026-03-02
- **Summary:** Created 5 missing tables (flights, flight_whiskeys, blind_tastings, blind_tasting_whiskeys, follows) via migration script. All verified present in production DB.

### [FIX-002] Strip Sensitive Fields from /api/user Response
- **Completed:** 2026-03-02
- **Summary:** Added `sanitizeUser()` helper to strip authToken, tokenExpiry, failedLoginAttempts, accountLockedUntil from all 7 user-returning endpoints in auth.ts.

### [FIX-003] Add API 404 Catch-All Route
- **Completed:** 2026-03-02
- **Summary:** Added `app.all("/api/*")` catch-all in routes.ts after all real routes but before Vite middleware. Returns 404 JSON for unknown API paths.

### [AUDIT-002] Auth & Session Security Review
- **Completed:** 2026-03-02
- **Summary:** Full auth security review. 0 critical, 2 high, 3 medium, 3 low. Fixed 4 issues inline: token expiry check on GET /api/user, session regeneration on login, auth token invalidation on logout, null instead of empty string for OAuth passwords. Session token bug identified and fixed (logout wasn't invalidating auth token). Findings in AUDIT-002-FINDINGS.md.

### [AUDIT-001] End-to-End Feature Walkthrough
- **Completed:** 2026-03-02
- **Summary:** Full API walkthrough complete. 3 critical: flights/blind-tastings/follows tables missing from DB (500 errors). 1 high: auth token leaked in /api/user. 2 medium: no API 404 catch-all, no export endpoint. 36+ endpoints passing. Findings in AUDIT-001-FINDINGS.md. Generated fix tasks FIX-001, FIX-002, FIX-003.

### [PREREQ-001] UI Redesign Phases 1-5
- **Completed:** 2026-02-28
- **Summary:** Mobile-first UI redesign complete. Bottom nav, activity cards, profile components, bottle detail hero, loading skeletons, empty states, micro-interactions, dark mode audit, visual QA.

### [PREREQ-002] Fix Mobile Home Page Collection
- **Completed:** 2026-02-28
- **Summary:** Mobile Home branch was showing mock activity data instead of user's bottle collection. Restored CollectionStats, FilterBar, CollectionGrid, and all modals to mobile layout.

### [PREREQ-003] Fix Missing Routes (/search, /profile)
- **Completed:** 2026-02-28
- **Summary:** BottomNav linked to /search and /profile which had no routes in App.tsx. Added routes and created ProfileRedirect component.

### [PREREQ-004] Add ProfileMenu for Mobile Navigation
- **Completed:** 2026-03-01
- **Summary:** Added Menu section to mobile Profile page (own profile only) with links to Dashboard, Flights, Blind Tastings, Rick House, Settings, Theme Toggle, and Logout with confirmation.

---

## Backlog

- Community features roadmap (Phase 1: The Hunt — see CONTEXT_PROJECT.md)
- Drops page: replace mock data with real store integration
- RadarChart component: integrate into review display (currently orphaned)
- Stripe integration for freemium tiers
- Push notification infrastructure
