# TASKS.md - MyWhiskeyPedia

> PM-owned task tracker. Single source of truth for project state.
> Updated by PM Agent after every task completion.

---

## Active Tasks

### [RICK-UX] UI/UX Review — "Taste with Rick" guided tasting flow — REVIEW COMPLETE (2026-07-22), FINDINGS AWAITING TRIAGE
- **Scope:** Standard (review-only, no code changes)
- **Assigned:** UI/UX lens, run in main context (ui-ux subagent has no browser tools; method required live pass, not code read)
- **Prerequisite:** Confirmed — flow resolves live in prod, no 404 (MODEL-001 + ROUTE-005..010 deploy verified 2026-07-22)
- **Method:** Live pass vs production, Playwright emulated 375×812 (NOT real hardware — FAB glyph legibility + atmosphere final calls remain deferred to real-device pass). Full "Guide Me" session on Discovery 8, signed in as Storm. "Just the Notes" mode NOT run.
- **Verdict:** "Different room" principle passes (chrome unmounted, Step out only exit, contextual greetings, "Opening the cellar…" loading, no emoji). Depth and product-coherence lenses fail — see findings.
- **Findings (11, severity-tagged, in session report):**
  - HIGH: RICK-UX-01 journal replay spawns duplicate "In progress" session (live repro left in Storm's prod data); RICK-UX-02 no depth/input affordance anywhere in guided flow; RICK-UX-03 "Write Review" bridge lands in 7-step granular modal vs locked 3-step prose-as-hero (caveat: edit path — verify new-review path)
  - MEDIUM: RICK-UX-04 old review score (4.3) presented as session outcome; RICK-UX-05 TTS auto-plays default-on every phase; RICK-UX-06 shelf suggestion stale immediately post-session; RICK-UX-07 warm-brown header gradient + decorative gold drift
  - LOW: RICK-UX-08 mode-sheet selection ambiguity; RICK-UX-09 stepper labels ~10px (below AUDIT-004 12px floor); RICK-UX-10 duplicated quote + share-shaped card without share action; RICK-UX-11 "Select a bottle…" dropdown breaks room voice
- **Proposed Figma batch (5–8 rule):** RICK-UX-02/03/04/07/08/09/10 as one session-surface redesign session. RICK-UX-01/06 → Developer (logic). RICK-UX-05 → Storm product call. RICK-UX-11 parks.
- **Non-design routing:** replit-dev-banner.js CSP error in prod console (feeds Replit-cleanup backlog); add `.playwright-mcp/` to .gitignore
- **Session close (2026-07-22, Storm "Go"):** COMPLETE & VERIFIED — vault note `_inbox/sessions/WhiskeyPedia Rick guided tasting UIUX review 2026-07-22.md` + 2 lessons (tooling.md: junction fix reinforcement, new claude-in-chrome hidden-window lesson) + Session Atlas entry; Notion Session Log `3a6ae6aa-4e5c-8133-9e2d-f555befef158` + project card (Next Action/Blockers/Summary) re-queried and confirmed, no duplicates. Housekeeping flag: prior "[DUPLICATE — ARCHIVE ME]" Session Log row from route-audit close still live (not archived) — Storm to archive.
- **RICK-UX-03 caveat RESOLVED (2026-07-22, code-verified):** the 7-step modal (`modals/ReviewModal.tsx`, STEPS len=7) is the composer for BOTH new and edit reviews — one component, `existingReview` optional. No 3-step prose-first composer exists anywhere; the d1ab120 "premium uplift" reworked `ReviewDetailPage` (display) + `RickReviewSession` (Rick-guided review mode), not the composer. Finding applies to every composer entry point. Also surfaced: THREE structured flows must cohere (TastingSession 5-phase no-score / RickReviewSession scored / ReviewModal 7-step).
- **Figma brief AUTHORED (Storm approved plan 2026-07-22):** `DESIGN-BRIEF-RICK-SESSION.md` at repo root — locked constraints, verified architecture map, per-finding design intent + acceptance criteria for the batch (02/03/04/07/08/09/10), out-of-scope fence, 4 triage questions for Storm.
- **TRIAGED (Storm, 2026-07-22, logged as D-013):** §7 answered — 03 bridge-only; 04 skippable re-score prompt at completion; 10 shareable card w/ real share action; 02 text-first (voice next phase, strip mic icons until then). Brief updated in place; batch (02/03/04/07/08/09/10) READY for the Claude Design session.
- **RICK-UX-01/06 FIXES BUILT (Storm "build" go, 2026-07-22; branch `fix/rick-ux-01-06`; pipeline Explore→Developer→Test→QA):**
  - [RICK-UX-01] Root cause: `handleResumeSession` (RickHouse.tsx:93) nulled the session id for completed entries → TastingSession mount took the POST /api/rick/start-session branch → duplicate row. Fix: always pass `session.id` (journal taps now GET-only); TastingSession sets `isCompleted` on mount when fetched session has `completedAt` → renders existing completion view (no phase-1 replay, no re-complete, exit dialog skipped); TTS effect gated on `!isCompleted` (no autoplay on record view). React 18 auto-batching verified race-free by QA. No server changes (GET endpoint + double-complete guard already existed).
  - [RICK-UX-06] Root cause: `generateSuggestions` computed `tastedIds` but never used it. Fix: `recentlyTastedIds` (completedAt < 30 days, strict-<) excluded in the shared `owned` filter → all branches skip just-tasted bottles, fallback ordering preserved; `handleSessionComplete` additionally invalidates `["/api/whiskeys"]`.
  - **Gates:** tests/rick-suggestions.test.ts NEW — 7/7 green (boundary both sides, in-progress non-exclusion, fallback, regressions); tsc 5 pre-existing before/after, zero new; QA **APPROVE-WITH-CONDITIONS** — all conditions Watch/live, none blocking; diff surface PM-verified (3 source + 1 test, no deps).
  - **QA Watch (follow-ups, not this deploy):** W1 resume-GET failure lands on a no-exit loading spinner (pre-existing, now reachable — needs error+exit state); W2 legacy completed row with null scriptJson → same spinner (live-verify none exist); no component test covers the resume-completed path (test gap → backlog); completion screen date shows "today" for old records (pre-existing, Figma batch); in-progress resume restarts at phase 1 (pre-existing).
  - **LIVE verification needed post-deploy:** completed journal tap → completion view + zero TTS calls + GET-only; prod duplicate "In progress" row resumes without spawning a third row; ReviewModal stability during ["/api/whiskeys"] refetch (5d).
- **DEPLOYED & LIVE-VERIFIED (2026-07-22, Storm "merge it"):** merge `525ce30` pushed; prod flipped to locally-built-hash-matched bundle `index-BksLhwy1.js` in ~3.5 min (byte-proof method). Live checks (signed-in 375px Playwright session): completed journal tap → GET /api/rick/session/30 ONLY (zero start-session POST, zero TTS), renders completion/record view, Back closes with no dialog, no new row; prod duplicate "In progress" row → GET /api/rick/session/31 only, resumes correctly, leave-dialog correct for in-progress, journal holds at 2 rows; shelf no longer shows the stale "worth another pour?" card (RICK-UX-06 exclusion live). RICK-UX-01 and RICK-UX-06 CLOSED.
- **Remaining watch (untested live):** QA 5d — ReviewModal stability during ["/api/whiskeys"] refetch after completing a tasting (needs a future real completion; watch during next session); W1 no-exit spinner on resume-GET failure (follow-up task); resume-completed path component-test gap (backlog).
- **Open:** run the Claude Design (Figma) session against DESIGN-BRIEF-RICK-SESSION.md; Storm may archive the prod duplicate "In progress" journal row whenever (it now resumes harmlessly)

### [MODEL-001] Retired Anthropic model — all AI features down since 2026-06-15 — DEPLOYED & VERIFIED 2026-07-22
- **Deploy verification (2026-07-22, post-merge):** production flipped to post-merge bundle `index-CDaj0KBM.js` ~4 min after push; confirmed by direct re-check. ROUTE-005..010 closeout shipped in the same deploy.
- **CLOSED (2026-07-22):** Storm's signed-in Rick smoke test PASSED live in production — AI features confirmed restored end-to-end. All MODEL-001 verification complete.
- **Scope:** Standard (hotfix)
- **Branch:** `fix/retired-anthropic-model` (off main tip)
- **Root cause:** All 7 server AI call sites hardcoded `claude-sonnet-4-20250514`, retired by Anthropic 2026-06-15 → API 404 not_found_error → errorStatus() propagated 404 to clients. Proven by live probe (old ID 404s; `claude-sonnet-5` resolves).
- **Retro-explains:** the original "taste with Rick" 404 report (network-layer via /api/rick/start-session, not a router miss) and "404 failed to generate review".
- **Fix:** 7 sites → `claude-sonnet-5` + `thinking: {type:"disabled"}` (Sonnet 5 defaults to adaptive thinking when param omitted; 5 sites read content[0] expecting text). Files: rick-service.ts ×3, routes.ts ×2, upc-lookup-service.ts, image-identify-service.ts.
- **Gates:** tsc baseline unchanged (5 pre-existing); live probe of exact request shape returned text-first content, 0 thinking tokens; QA APPROVE-WITH-CONDITIONS — condition (verify model ID resolves live) satisfied by probe.
- **Watch:** Sonnet 5 intro pricing $2/$10 per MTok through 2026-08-31, then $3/$15; new tokenizer ~30% more tokens/text — watch AI-feature cost after merge. Test-gap noted by QA: no payload-assertion test on messages.create args (backlog).

### [ROUTE-SWEEP] Route Integrity Audit — CLOSEOUT APPLIED (2026-07-22), 2 ITEMS REMAIN OPEN
- **Closeout (Storm confirmed "close any findings you can"; Developer → QA APPROVED, tsc baseline unchanged; branch `fix/route-sweep-closeout`):**
  - [ROUTE-005] Empty-state CTA relabeled "Browse the community" (label now matches /search→Community; catalog build stays open as product decision)
  - [ROUTE-006] 404 page CTA auth-aware — signed-out users get "Sign In"→/auth (QA watch: brief "Sign In" flash while auth query loads; optional isLoading gate)
  - [ROUTE-007] /privacy linked from auth-page footer (was zero inbound links)
  - [ROUTE-008] Challenges/Progress/Exercises added to mobile hamburger + desktop user dropdown (cluster was self-linking only)
  - [ROUTE-009] Duplicate /uploads static mount removed from routes.ts (index.ts:111 canonical)
  - [ROUTE-010] ReviewModal.tsx.bak deleted (git-recoverable)
- **TABLED (Storm, 2026-07-22):** whiskey catalog surface — tabled, no build; MobileBottleDetail.tsx + bottle/* family — tabled, leaning WIRE into a future bottle-detail page (do not delete)
- **Original sweep record:**
- **Scope:** Deep (3 parallel Explore inventories: router registry / nav targets / API calls vs Express)
- **Branch:** `fix/route-integrity-audit` (off `fw-v34-beta-and-cleanup` tip — main is its ancestor; main untouched)
- **Date:** 2026-07-22
- **Method:** Reconciled 27 registered wouter routes × ~95 nav call sites × ~130 client API calls × 151 Express endpoints, primary sources only.
- **Applied (QA APPROVED 2026-07-22, tsc clean — 5 pre-existing errors, none new):**
  - [ROUTE-001] `WhiskeyDetailModal.tsx:723` Eye button navigated to unregistered `/reviews/:id/:noteId` → repointed to `/whiskey/:id/review/:reviewId`. **This was the completed-review 404.**
  - [ROUTE-002] `MarketValueModal.tsx` GET hit `/api/whiskeys` (default getQueryFn uses queryKey[0]) instead of `/api/whiskeys/:id/market-values` → explicit queryFn added.
  - [ROUTE-003] `PriceTrackingModal.tsx` — same class → explicit queryFn to `/api/whiskeys/:id/prices`.
  - [ROUTE-004] `not-found.tsx` rendered a second BottomNav (MobileShell already provides it) → removed.
- **NOT reproducible in current code (likely stale prod deploy or manual URL — verify deployed SHA):**
  - "Taste with Rick" entry 404 — every tasting entry (Home, RickHouse, WhiskeyDetailModal, RickShelf) is modal-state, zero route navigation in the flow.
  - `/stores/:id` 404 — every client nav is singular `/store/${id}` (registered); plural exists only as API paths. No git history of a plural client link.
  - Nav-less 404 chrome — fixed on main 2026-03-04 (`0e6f426`); remaining gap: `BottomNav.tsx:24` returns null when logged out (product call, held).
- **Held for Storm (product decisions):** see findings report — BETA-001 `/search`→Community "Browse catalog" repoint; logged-out 404 affordance; `/privacy` + Challenges/Progress/Exercises cluster unreachable by nav; orphans (MobileBottleDetail, ReviewModal.tsx.bak deletion needs per-item confirmation).
- **Doc drift flagged:** PREREQ-004/PHASE5-001 claims ProfileMenu links to Dashboard/Flights/Rick House/Challenges/Progress/Exercises — ProfileMenu.tsx today has only Settings/Theme/Logout.

### [FW-V34-002] Delete-operation auth bug — COMPLETE
- **Scope:** Standard
- **Pipeline:** PM diagnosis → Developer fix → Test (regression) → Security review → condition applied
- **Completed:** 2026-06-04
- **Root cause:** `isAuthenticated` fired `req.session.destroy(() => {})` on stale sessions WITHOUT awaiting, then the Bearer fallback wrote `userId` + `save()` into the session being destroyed underneath it — intermittent 401/500 depending on PgStore timing. Same pattern in `GET /api/user`.
- **Fix:** awaited `req.session.regenerate()` (atomic destroy+fresh session) at both sites + fail-closed `!req.session` guards before token-path session writes (second guard per Security review condition).
- **Gate results:** 4/4 hermetic regression tests (tests/auth-middleware.test.ts) incl. deterministic race-order assertion; tsc clean (5 pre-existing storage.ts errors, none new); integration suite A/B: 36 failures before fix → 32 after, zero new failures. Security verdict: APPROVE-WITH-CONDITIONS, condition applied and re-verified.
- **Watch:** 32 pre-existing integration test failures (suite needs live server + DB state — feeds FW-V34-004); `req.session.save` error suppression (pre-existing) if store reliability degrades; rate-limit token+stale-cookie path at community-features scale.

### [FW-V34-003] Migrate console.log residue to logger — COMPLETE
- **Scope:** Quick → **Standard** (scope reconciled: routes.ts had ~40 console.log, not the 3 the finding cited; "sweep while in there" = whole file)
- **Assigned:** Developer → QA
- **Completed:** 2026-06-08
- **Source:** Architect finding during FW-V34-001 (2026-06-03)
- **Summary:** All 40 `console.log` in `server/routes.ts` converted to `logger` (`import logger from "./lib/logger"`, default import matching server/auth.ts). Levels mapped: failures/"not found"/"cleaning up" → `warn`, operational/verbose → `info`. tsc clean (only the 3 pre-existing error groups; none new). QA APPROVED.
- **Gate result:** `grep -n "console.log" server/routes.ts` = **zero**. (Original gate "zero in all server/" was unrealistic for one Quick task — the other **109 console.log across 15 files** belong to backlog item CL-2, now recounted accurately.)
- **Watch / follow-ups generated:**
  - logger.ts exposes only info/warn/error — **no `debug` level**; 4 verbose lines (per-request "Getting whiskeys", "Sample whiskey data", "Looking for review", `[CRIT-001 DEBUG]`) had to land at `info`. Consider adding `logger.debug`.
  - 27 pre-existing `console.error`/`console.warn` in routes.ts still bypass logger (out of scope here) — fold into a full-adoption pass.

### [FW-V34-004] Audit existing tests against PATTERNS.md conventions — COMPLETE
- **Scope:** Quick
- **Assigned:** Test → Architect
- **Completed:** 2026-06-08
- **Source:** QA gap note during FW-V34-001 (2026-06-03)
- **Summary:** Test Agent audited **7** flat test files (the 6 + `auth-middleware.test.ts` added in FW-V34-002). All 7 violate the documented "mirror-the-source" rule, which is unworkable here: integration tests hit the live app via `fetch` and don't map 1:1 to a source module, and `auth.test.ts` + `auth-middleware.test.ts` would both mirror to `tests/server/auth.test.ts` (collision). Recommendation **AMEND, not move files** — Architect concurred and applied a tightened amendment to **PATTERNS.md line 63** (flat feature-scoped convention + retirement note citing this gate ID).
- **Gate result:** per-file verdict delivered; PATTERNS.md amended; Architect-approved. No test files moved.
- **Watch / follow-ups generated:**
  - PATTERNS.md line 64 still says integration tests use `supertest`; they actually use native `fetch` — separate doc-fix ticket.
  - Coverage-quality gaps flagged (permissive assertions: AUTH-003/004, WHI-013/014, REV-021, loose status-code arrays) — separate test-hardening task.

### [FW-V34-001] PATTERNS.md population (v3.4 pipeline validation) — COMPLETE
- **Scope:** Standard
- **Assigned:** Architect → QA
- **Completed:** 2026-06-03
- **Summary:** PATTERNS.md authored from codebase conventions (8 sections, file:line citations). QA verdict: APPROVE-WITH-CORRECTIONS — caught Architect's false "tests/ does not exist" claim (6 test files exist); corrections applied. This task doubled as the v3.4 framework deployment validation (MIGRATION.md step 5).
- **Watch:** console.log residue in server/routes.ts:85,87,95-96; session-destroy/token race suspected in delete-op auth bug; Test Agent should audit the 6 existing test files against the documented naming convention.

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

### [UIAUDIT-001] Fix Profile Page Auth State + Response Shape — QA-VERIFIED (code)
- **Scope:** Standard
- **Assigned:** Developer → QA
- **Priority:** P1
- **Status:** QA APPROVED 2026-06-08 (code-level) — 4/4 logic criteria MET; response shape COMPLETE (every `stats.*` + `user.*` field Profile.tsx reads is present; `uniqueBottles`→`whiskeyCount` remap at routes.ts:2435, stale `totalBottles` not leaked). Cascading logout/#7 = NEEDS LIVE TEST (live outside scope files). Shippable.
- **Quick fix DONE 2026-06-08 (folded into branch):** removed the `[CRIT-001 DEBUG]` block (was routes.ts:2422-2428) — eliminated the extra per-request `getWhiskeys()` query on own-profile loads. tsc clean.
- **Root Cause:** `getUserByProfileSlug()` required `isPublic === true`, blocking private profiles from viewing own page. No username fallback when `profileSlug` is null. Response shape mismatch (API returned `stats.totalBottles`, frontend expected `stats.whiskeyCount`).
- **Fixes Applied:**
  - `storage.ts`: `getUserByProfileSlug()` — added `skipPublicCheck` param + username fallback lookup
  - `storage.ts`: `getPublicProfile()` — added `skipPublicCheck` param for own-profile bypass
  - `storage.ts`: Added `getReviewCountForUser()` method
  - `routes.ts`: `/api/profile/:slug` — detects authenticated user viewing own profile, bypasses `isPublic` check, normalizes response shape to match frontend interface
- **Cascading fixes:** Resolves audit items #1 (profile auth), #2 (no logout — was hidden behind broken ProfileMenu), #7 (hamburger/overflow — same root cause)

### [UIAUDIT-002] Review Card Text Overflow — QA-VERIFIED (code)
- **Scope:** Quick
- **Assigned:** Developer → QA
- **Priority:** P2
- **Status:** QA APPROVED 2026-06-08 (code-level) — 3 MET + 1 NEEDS LIVE VISUAL. Card `overflow-hidden` (card.tsx:12), username `truncate max-w-[120px]` (Community.tsx:86), flex `min-w-0` (Community.tsx:73,75); whiskey/distillery/review all line-clamped. Shippable.
- **Watch (not blocking):** review body uses BOTH a JS 150-char substring and CSS `line-clamp-4` → possible double-ellipsis; confirm in a long-username/long-review smoke test.
- **Fixes Applied:**
  - `card.tsx`: Added `overflow-hidden` to base Card component
  - `Community.tsx`: Added `truncate max-w-[120px]` to username in FollowingReviewCard, `min-w-0` to flex containers for proper truncation

### [UIAUDIT-003] Login Re-entry Point — CLOSED (Non-issue)
- **Scope:** Quick
- **Assigned:** Developer
- **Priority:** P2
- **Status:** CLOSED — verified working as designed
- **Summary:** ProtectedRoute redirects to `/auth` when session expires. Auth page has both username/password and Google OAuth. No dead-end scenario.

### [BETA-001] Collection Empty State Rework — QA-VERIFIED (code)
- **Scope:** Standard
- **Assigned:** Developer
- **Priority:** P1 (beta blocker)
- **Status:** QA APPROVED 2026-06-08 (code-level) — all 5 criteria MET + CTA wiring resolved. Final visual pass remains for your sign-off.
- **Files:** `client/src/components/CollectionGrid.tsx`, `client/src/pages/Home.tsx`
- **Acceptance criteria:**
  - [x] No centered icon pattern (empty state opens with eyebrow label, not icon — CollectionGrid.tsx:75-125)
  - [x] Headline uses Playfair Display at display scale (`text-display-hero` → `--font-display` — CollectionGrid.tsx:79)
  - [x] Three distinct secondary CTAs — **now distinct in behavior**: Scan→`openBarcodeScanner`, Import CSV→`openImportModal`, Browse→`navigate("/search")` (CollectionGrid props :21-23, wired both Home sites)
  - [x] Rick House teaser present (:118-122)
  - [x] Left-aligned editorial layout (no centering class — :77)
- **CTA resolution (2026-06-08):** The earlier flag (all 3 CTAs called `onAddNew`) is fixed — Explore confirmed all targets exist, Developer wired them, QA approved. Decoupled via 3 optional props.
- **Watch (product, your call):** "Browse catalog" navigates to `/search`, which renders `Community` (a social/public-reviews feed), not a whiskey-catalog browser. Wiring is correct/crash-safe; confirm `/search`→`Community` is the intended "Browse catalog" destination, or repoint.

### [BETA-002] Auth Page Left Panel Rework — COMPLETE
- **Scope:** Standard
- **Assigned:** Developer → QA
- **Priority:** P1 (beta blocker)
- **Completed:** 2026-06-08
- **Status:** QA APPROVED 2026-06-08 — all 6 criteria MET after the headline fix. Final visual pass remains for your sign-off.
- **File:** `client/src/pages/auth-page.tsx`
- **Acceptance criteria:**
  - [x] No amber/warm gradient anywhere on auth page (only intentional gold radial glow at 6% — auth-page.tsx:169)
  - [x] Background uses V2 near-black tokens (`--background` 0 0% 4% / #0A0A0A — :165,167)
  - [x] **Headline is Playfair Display at 42px+ — FIXED.** Clamp floor changed to a **px literal**: `clamp(42px, 5vw, 3.5rem)` (:179), immune to the ≤375px root override. QA re-verified: **320px→42px, 375px→42px, 1280px→56px** (Storm's 375px re-verify ✓).
  - [x] No feature checklist (left panel is logo + h1 + subline only — :166-186)
  - [x] Invite code collapsed on Sign In tab (`showBetaOnLogin=false` default — :77,244-267)
  - [x] Returning users see sign-in form immediately (`isLogin=true` default — :72)
- **Fix applied:** clamp minimum `2.5rem` → `42px` at auth-page.tsx:179 (px floor, per Storm — chosen over a rem bump so the ≤375px root-size override at index.css:697-698 can't collapse it). index.css untouched.
- **Watch:** hardcoded brand hex `text-[#D4A44C]` on mobile wordmark (:195) bypasses `text-primary` token; legacy `shadow-warm-*` utilities still on form card (:200,208,219) — not gradients so criterion 1 passes, but flag if "no warm" was holistic.

### [BETA-003] Rick House Atmospheric Rework — QA-VERIFIED (code)
- **Scope:** Standard
- **Assigned:** Developer
- **Priority:** P1 (beta blocker)
- **Status:** QA APPROVED 2026-06-08 (code-level) — 4 MET + 1 NEEDS LIVE VISUAL (provably darker in code). No defects.
- **Files:** `client/src/pages/RickHouse.tsx`, `client/src/components/rick/RickAtmosphere.tsx`, `client/src/components/MobileShell.tsx`, `client/src/components/BottomNav.tsx`
- **Acceptance criteria:**
  - [x] Standard nav completely hidden (`HIDDEN_NAV_ROUTES=["/rick-house"]`, BottomNav unmounted — MobileShell.tsx:8,12,19)
  - [x] "← Step out" only nav affordance (single back button — RickHouse.tsx:124-134; uses `<ArrowLeft>` icon not literal "←", cosmetic)
  - [x] Greeting hero-scale (`text-display-hero` clamp(2.5rem,8vw,5rem) — RickAtmosphere.tsx:43)
  - [x] Zone labels between sections ("THE SHELF" :147-153, "THE JOURNAL" :163-169, `text-label-caps`)
  - [~] Background darkness shift — code-confirmed darker (`#050505` RickHouse.tsx:122 vs app `#0A0A0A`); **NEEDS LIVE VISUAL** for final confirmation
- **Watch:** atmospheric "Step out" treatment only applies when `isMobile`; desktop renders standard `<Header />` (RickHouse.tsx:135-137) — gap only if desktop immersion was intended. Hidden-nav uses exact `.includes()` — any `/rick-house/*` sub-route would re-show nav (none exist yet).

### [BETA-004] Mobile Collection Header Typography — QA-VERIFIED (code)
- **Scope:** Quick
- **Assigned:** Developer → QA
- **Priority:** P2
- **Status:** QA APPROVED 2026-06-08 (code-level) — 3/3 MET. Shippable; pending visual sign-off.
- **File:** `client/src/pages/Home.tsx`
- **Acceptance criteria:**
  - [x] Page title uses `text-display-hero` clamp on mobile (`<h1>` Home.tsx:136 → clamp(2.5rem,8vw,5rem))
  - [x] Username is a kicker (`text-label-caps` "{NAME}'S SHELF" above title, Home.tsx:133-135); `<h1>` reads only "Collection"
  - [x] Visually distinct (display font + 600 weight + hero clamp vs caps kicker)
- **Watch (follow-up, not this deploy):** desktop header (Home.tsx:317-320) still uses old possessive "{name}'s Collection" — cross-platform inconsistency.

### [BETA-005] Bottle Card Mobile Hover Fix + Status Labels — QA-VERIFIED (code)
- **Scope:** Standard
- **Assigned:** Developer → QA
- **Priority:** P2
- **Status:** QA APPROVED 2026-06-08 (code-level) — 4/4 MET. Shippable; pending visual sign-off.
- **File:** `client/src/components/WhiskeyCard.tsx`
- **Acceptance criteria:**
  - [x] No gradient overlay on mobile (hover panel gated `hidden md:block` + translate-off — WhiskeyCard.tsx:148)
  - [x] ⋯ handle opens bottom sheet (`handleMenuTap`→`setShowBottomSheet` :36-39, sheet :184-224 with Edit/Details/Review)
  - [x] Status is a text pill ("Sealed/Open/Finished/Gifted" — :17-25, :75-79), not a color-only dot
  - [x] Desktop hover unchanged (md: action bar + scale/glow/name-color retained :147-180)
- **Watch (follow-ups, not this deploy):**
  - Bottom sheet is hand-rolled (plain divs) vs the shared `ui/sheet` primitive used by 6 other components; lacks focus-trap/Esc/role=dialog — **LARGER** a11y+refactor follow-up.
  - ⋯ handle + Heart gate on `useIsMobile()` (JS hook), so possible first-paint flash before it resolves (criterion 1 overlay is pure CSS, unaffected).

---

## Queue

### [DESIGN-001] Formalize Design System as DESIGN.md — COMPLETE
- **Scope:** Standard
- **Assigned:** UI/UX Agent
- **Priority:** P1
- **Status:** COMPLETE
- **Completed:** 2026-03-22
- **Summary:** Extracted full design system from `tailwind.config.ts`, `index.css`, `Logo.tsx`, `BottomNav.tsx`, and Rick House components. Created DESIGN.md v2.0 at project root as single source of truth. Covers: color system (HSL custom properties), Gold Rule (precious accent constraint), typography stack, spacing, elevation, card system, bottom nav pattern, logo usage, Rick House sub-design language, motion, accessibility. Updated CONTEXT_PROJECT.md design system status to Active.

### [DESIGN-002] Rick House Center FAB Icon — 3 Concepts — COMPLETE
- **Scope:** Standard
- **Assigned:** UI/UX Agent
- **Priority:** P1
- **Status:** COMPLETE — 3 concepts presented, awaiting Storm's selection
- **Completed:** 2026-03-22
- **Summary:** Three production-ready SVG icon concepts for the Rick House center FAB:
  - **A: Glencairn + Sparkle** — refined current icon with AI sparkle accent. Strongest brand tie, but duplicates logo.
  - **B: Nosing Glass + Aroma Lines** — glass with rising vapor lines. Best at communicating "tasting." May read as "hot drink."
  - **C: Diamond Pour** — abstract gem with pour stream. Most unique and geometric. Most abstract risk.
- **Decision needed:** Storm selects icon concept → Developer implements.

### [DESIGN-003] Rick House Full Page Layout — High-Fidelity Screen — COMPLETE
- **Scope:** Standard
- **Assigned:** UI/UX Agent → Developer
- **Priority:** P1
- **Status:** COMPLETE — `rick-house-redesign.html` ready for review
- **Completed:** 2026-03-22
- **Summary:** Full high-fidelity mobile screen (375px viewport) in HTML/CSS following DESIGN.md v2.0. Three zones: Atmosphere (ambient gold glow + Glencairn + contextual greeting), Shelf (3 suggestion cards with conversational prompts), Journal (tasting history with Rick notes and completion accents). Bottom nav included for full context. Stitch MCP attempted but returned empty — screen hand-crafted directly.
- **Output:** `/rick-house-redesign.html` — open in browser to review
- **Next:** Storm reviews → Developer translates to React components (existing `RickAtmosphere.tsx`, `RickShelf.tsx`, `RickJournal.tsx` are already close to this design)

### [UIAUDIT-004] Rick House Nav Prominence — QA-VERIFIED (code), 1 design call open
- **Scope:** Medium
- **Assigned:** Developer → QA
- **Priority:** P1
- **Status:** QA APPROVED 2026-06-08 (code-level) — scanner removal complete, FAB is Rick House. **Criterion 1 "MessageSquare + RICK label" NOT MET as written:** FAB renders the brand Glencairn-glass SVG, no text label (BottomNav.tsx:62-83) — arguably better, but a **DESIGN CALL for Storm**: accept the glass (update criteria) or swap to MessageSquare + "RICK". `onScanClick` removed (zero hits), MobileShell scanner/dialog gone, `rick-glow` keyframe applied (index.css:434-450). BarcodeScanner NOT orphaned (reachable via AddWhiskeyModal + Home empty-state Scan CTA).
- **Quick fix DONE 2026-06-08 (folded into branch):** deleted dead `rickActive` var (BottomNav.tsx). tsc clean.
- **Design call RESOLVED 2026-06-08:** Storm kept the Glencairn-glass FAB (declined the MessageSquare+"RICK" swap). Criterion 1 reads as the glass treatment for this deploy; final glyph-legibility at 24px is part of the visual pass.
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

- Tests: payload-assertion test capturing `messages.create` args (model ID + `thinking` param) at one AI call site — guards against future model-retirement regressions (MODEL-001 QA gap, 2026-07-22)
- ~~Phase 5: Palate Development~~ — COMPLETE (PHASE5-001)
- Trade board: add in-app messaging/offers for trade negotiations
- Drops page: implement real store integration (currently "Coming Soon")
- RadarChart component: integrate into review display (currently orphaned)
- Stripe integration for freemium tiers
- Push notification infrastructure
- Performance: code splitting with React.lazy() (AUDIT-007 P-1)
- Performance: N+1 query refactor with JOINs (AUDIT-007 P-2)
- Performance: React Query staleTime tuning (AUDIT-007 P-4)
- Cleanup: replace remaining **109 console.log across 15 server/ files** with logger (AUDIT-008 CL-2; recount 2026-06-08 after FW-V34-003 cleared all 40 in routes.ts. Top offenders: upc-lookup-service 26, reset-database 24, rick-config 11, image-identify-service 7. The 1 hit in logger.ts is the logger's own sink — not a target.)
- Logger: add a `debug` level to `server/lib/logger.ts` (currently info/warn/error only); re-level the 4 verbose routes.ts lines parked at `info` (FW-V34-003 follow-up)
- Cleanup: route the 27 pre-existing `console.error`/`console.warn` in routes.ts through logger for full adoption (FW-V34-003 follow-up)
- Docs: PATTERNS.md line 64 says integration tests use `supertest`; they actually use native `fetch` — correct or remove (FW-V34-004 follow-up)
- Tests: harden permissive assertions flagged in FW-V34-004 audit (AUTH-003/004, WHI-013/014, REV-021, loose status-code arrays — they pass regardless of behavior)
- Cleanup: replace ~20 `any` types with `unknown` across 6 server/ files (AUDIT-008 CL-4; verified 2026-06-07 — previous count of 6 was stale)
- Error boundary: add top-level ErrorBoundary in App.tsx (AUDIT-006 M-1)
- Dead dependencies: remove unused `@zxing/browser`, `@zxing/library` (barcode uses html5-qrcode), `memorystore` (sessions use connect-pg-simple)
- Replit cleanup: remove `.replit` config; evaluate removing `@replit/vite-plugin-cartographer` and `@replit/vite-plugin-runtime-error-modal` from devDeps
- Spec files: reconcile `specs/DATABASE.md` and `specs/API.md` against current 35-table schema and 136 API endpoints (specs pre-date community features)
