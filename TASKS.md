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

### [AUDIT-003] Database & API Integrity Check — COMPLETE
- **Scope:** Standard
- **Assigned:** Data, Developer
- **Priority:** P1
- **Status:** COMPLETE — findings logged in AUDIT-003-FINDINGS.md
- **Summary:** 3 critical (whiskey ownership checks missing in flights/blind-tastings, unbounded list endpoints), 3 high (no query param limits, JSONB validation gap, session userId inconsistency in deletes), 3 medium, 2 low. Critical fixes applied: ownership validation in addWhiskeyToFlight and createBlindTasting, limit caps on all list endpoints, getUserId consistency in delete routes, distillery search limit.

### [AUDIT-004] Mobile UI Completeness Audit — COMPLETE
- **Scope:** Standard
- **Assigned:** UI/UX, Test
- **Priority:** P2
- **Status:** COMPLETE — findings logged in AUDIT-004-005-FINDINGS.md
- **Summary:** 3 high (modal width overflow, grid gap too large, text below 12px minimum), 5 medium. Fixes applied: responsive modal width, responsive grid gap, text-[10px] bumped to text-xs for WCAG AA. Remaining medium items (FilterBar width, safe-area-inset, CollectionStats text) flagged for follow-up.

### [AUDIT-005] Desktop Regression Check — COMPLETE
- **Scope:** Quick
- **Assigned:** Test
- **Priority:** P2
- **Status:** COMPLETE — PASS, no regressions. Findings in AUDIT-004-005-FINDINGS.md
- **Summary:** Desktop layout intact at 1280px+. Header, BottomNav, grids, containers all correct. 3 low optimization opportunities noted (modal scaling, community grid cols, chart gaps).

### [AUDIT-006] Error Handling & Edge Cases — COMPLETE
- **Scope:** Standard
- **Assigned:** Developer, Test
- **Priority:** P2
- **Status:** COMPLETE — findings logged in AUDIT-006-FINDINGS.md
- **Summary:** Grade B+. 0 critical, 3 medium (no top-level error boundary, getUserId throws 500 instead of 401, NaN filter bug), 6 low. Fixes applied: getUserId now throws with status 401, catch blocks use errorStatus() for proper HTTP codes, NaN guard added to useWhiskeyCollection rating filter.

### [AUDIT-007] Performance Baseline — COMPLETE
- **Scope:** Quick
- **Assigned:** Developer
- **Priority:** P3
- **Status:** COMPLETE — findings logged in AUDIT-007-008-FINDINGS.md
- **Summary:** 3.4 MB main bundle (no code splitting), 2 N+1 query patterns, 4+ endpoints missing pagination, staleTime: Infinity globally, images missing dimensions. Pagination caps applied via parsePaginationParams helper. Remaining items (code splitting, N+1 JOIN refactor, staleTime tuning) flagged for post-beta optimization.

### [AUDIT-008] Pre-Beta Cleanup — COMPLETE
- **Scope:** Quick
- **Assigned:** Developer
- **Priority:** P3
- **Status:** COMPLETE — findings logged in AUDIT-007-008-FINDINGS.md
- **Summary:** Mock Drops data removed (replaced with "Coming Soon" placeholder), Drops page inline styles converted to Tailwind. 223 console.log instances and 6 `any` types flagged for future cleanup pass. CORS localhost guard already conditional on NODE_ENV.

### [UIAUDIT-001] Fix Profile Page Auth State + Response Shape — IN PROGRESS
- **Scope:** Standard
- **Assigned:** Developer
- **Priority:** P1
- **Status:** CODE COMPLETE — awaiting deploy verification
- **Root Cause:** `getUserByProfileSlug()` required `isPublic === true`, blocking private profiles from viewing own page. No username fallback when `profileSlug` is null. Response shape mismatch (API returned `stats.totalBottles`, frontend expected `stats.whiskeyCount`).
- **Fixes Applied:**
  - `storage.ts`: `getUserByProfileSlug()` — added `skipPublicCheck` param + username fallback lookup
  - `storage.ts`: `getPublicProfile()` — added `skipPublicCheck` param for own-profile bypass
  - `storage.ts`: Added `getReviewCountForUser()` method
  - `routes.ts`: `/api/profile/:slug` — detects authenticated user viewing own profile, bypasses `isPublic` check, normalizes response shape to match frontend interface
- **Cascading fixes:** Resolves audit items #1 (profile auth), #2 (no logout — was hidden behind broken ProfileMenu), #7 (hamburger/overflow — same root cause)

### [UIAUDIT-002] Review Card Text Overflow — IN PROGRESS
- **Scope:** Quick
- **Assigned:** Developer
- **Priority:** P2
- **Status:** CODE COMPLETE — awaiting deploy verification
- **Fixes Applied:**
  - `card.tsx`: Added `overflow-hidden` to base Card component
  - `Community.tsx`: Added `truncate max-w-[120px]` to username in FollowingReviewCard, `min-w-0` to flex containers for proper truncation

### [UIAUDIT-003] Login Re-entry Point — CLOSED (Non-issue)
- **Scope:** Quick
- **Assigned:** Developer
- **Priority:** P2
- **Status:** CLOSED — verified working as designed
- **Summary:** ProtectedRoute redirects to `/auth` when session expires. Auth page has both username/password and Google OAuth. No dead-end scenario.

---

## Queue

### [UIAUDIT-004] Rick House Nav Prominence — IN PROGRESS
- **Scope:** Medium
- **Assigned:** Developer
- **Priority:** P1
- **Status:** CODE COMPLETE — awaiting deploy verification
- **Decision:** Rick House replaces barcode scanner as center FAB. Scanner was broken (navigated to `/?barcode=` but Home didn't consume it) and duplicated inside AddWhiskeyModal.
- **Fixes Applied:**
  - `BottomNav.tsx`: Replaced ScanLine center FAB with Rick House button (MessageSquare icon + "RICK" label). Removed `onScanClick` prop. Added active state detection for `/rick-house`.
  - `MobileShell.tsx`: Removed broken scanner state management and BarcodeScanner dialog. Simplified to shell wrapper.
  - `index.css`: Added `rick-glow` keyframe animation — subtle 3s ambient pulse on the center button (warm gold shadow expansion). Press state scales down for tactile feedback.
- **Nav layout:** Home | Search | [RICK] | Drops | Profile
- **Scanner access:** Preserved in AddWhiskeyModal (Scan Barcode option) where it actually works with API lookup.

### [UIAUDIT-005] Community Nav Presence
- **Scope:** Medium
- **Priority:** P3 (depends on community feature readiness)
- **Summary:** Tasting Clubs, social features not accessible from mobile bottom tab. Needs dedicated entry point when community features are beta-ready.

---

## Completed Tasks

### [PHASE5-001] Palate Development — Challenge System, Progress Tracking, AI Exercises
- **Completed:** 2026-03-03
- **Scope:** Deep
- **Assigned:** Developer
- **Priority:** P1
- **Summary:** Full Phase 5: Palate Development implementation. Added 4 new DB tables (challenges, user_challenges, user_progress, palate_exercises) with Drizzle migration. Challenge system with 10 default challenges across 5 types (review_streak, flavor_hunt, explore_type, blind_identify, community_challenge). XP/level system with 10 levels (Newcomer → Legend). Streak tracking with milestone XP bonuses (7-day, 30-day). Leaderboard for public users. AI-generated palate exercises via Rick House Claude API integration (4 exercise types: nose_training, blind_comparison, flavor_isolation, palate_calibration). Review creation now awards XP and updates streaks. 12 new API endpoints. 3 new frontend pages (Challenges, ProgressPage, PalateExercises). ProfileMenu updated with Challenges, Progress, and Palate Exercises links.

### [PHASE4-001] Social Layer — Activity Feed, Palate Matching, Collection Comparison, Trade Flagging
- **Completed:** 2026-03-03
- **Scope:** Deep
- **Assigned:** Developer
- **Priority:** P1
- **Summary:** Full Phase 4: Social Layer implementation. Added 2 new DB tables (activities, trade_listings) with Drizzle migration. Activity feed logs follow/add_bottle/review/like/trade events. Palate matching algorithm uses cosine similarity on scoring tendencies + shared flavor analysis. Collection comparison computes overlap percentage, shared/unique bottles, stat comparison. Trade board with CRUD for listings. 14 new API endpoints. 3 new frontend pages (PalateMatches, TradeListings, CollectionCompare). Enhanced Community page with Activity tab and social feature links sidebar. Compare Collection button on user profiles.

### [FIX-001] Create Missing Database Tables
- **Completed:** 2026-03-02
- **Summary:** Created 5 missing tables (flights, flight_whiskeys, blind_tastings, blind_tasting_whiskeys, follows) via migration script. All verified present in production DB.

### [FIX-002] Strip Sensitive Fields from /api/user Response
- **Completed:** 2026-03-02
- **Summary:** Added `sanitizeUser()` helper to strip authToken, tokenExpiry, failedLoginAttempts, accountLockedUntil from all 7 user-returning endpoints in auth.ts.

### [FIX-003] Add API 404 Catch-All Route
- **Completed:** 2026-03-02
- **Summary:** Added `app.all("/api/*")` catch-all in routes.ts after all real routes but before Vite middleware. Returns 404 JSON for unknown API paths.

### [AUDIT-008] Pre-Beta Cleanup
- **Completed:** 2026-03-02
- **Summary:** Mock Drops data removed (Coming Soon placeholder), Drops page inline styles converted to Tailwind. Findings in AUDIT-007-008-FINDINGS.md.

### [AUDIT-007] Performance Baseline
- **Completed:** 2026-03-02
- **Summary:** 3.4 MB main bundle, N+1 queries, missing pagination documented. Pagination caps applied. Findings in AUDIT-007-008-FINDINGS.md.

### [AUDIT-006] Error Handling & Edge Cases
- **Completed:** 2026-03-02
- **Summary:** Grade B+. getUserId 401 fix, errorStatus() helper, NaN rating guard. Findings in AUDIT-006-FINDINGS.md.

### [AUDIT-005] Desktop Regression Check
- **Completed:** 2026-03-02
- **Summary:** PASS — no regressions at 1280px+. Findings in AUDIT-004-005-FINDINGS.md.

### [AUDIT-004] Mobile UI Completeness Audit
- **Completed:** 2026-03-02
- **Summary:** 3 high fixes (modal width, grid gap, text size). Findings in AUDIT-004-005-FINDINGS.md.

### [AUDIT-003] Database & API Integrity Check
- **Completed:** 2026-03-02
- **Summary:** 3 critical fixes (whiskey ownership validation, pagination limits). Findings in AUDIT-003-FINDINGS.md.

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

- ~~Phase 5: Palate Development~~ — COMPLETE (PHASE5-001)
- Trade board: add in-app messaging/offers for trade negotiations
- Drops page: implement real store integration (currently "Coming Soon")
- RadarChart component: integrate into review display (currently orphaned)
- Stripe integration for freemium tiers
- Push notification infrastructure
- Performance: code splitting with React.lazy() (AUDIT-007 P-1)
- Performance: N+1 query refactor with JOINs (AUDIT-007 P-2)
- Performance: React Query staleTime tuning (AUDIT-007 P-4)
- Cleanup: replace 223 console.log with logger (AUDIT-008 CL-2)
- Cleanup: replace 6 `any` types with `unknown` (AUDIT-008 CL-4)
- Error boundary: add top-level ErrorBoundary in App.tsx (AUDIT-006 M-1)
