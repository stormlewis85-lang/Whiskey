# AUDIT-007/008: Performance & Pre-Beta Cleanup — Findings

> **Date:** 2026-03-02
> **Scope:** Bundle size, lazy loading, queries, pagination, console.log, mock data, dead code

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 4 |
| Medium | 6 |
| Low | 5 |

---

## AUDIT-007: Performance

### HIGH

#### P-1: 3.4 MB Main Bundle — No Code Splitting
- **File:** `dist/public/assets/index-BnOxtNiX.js` — 3,460 KB
- **Issue:** All 15+ page components eagerly imported in App.tsx (lines 9-21). No React.lazy() usage.
- **Impact:** Slow initial load, poor Core Web Vitals.
- **Fix:** Wrap route components with React.lazy() + Suspense boundaries.

#### P-2: N+1 Query Patterns
- **File:** `server/storage.ts` (getFlightWithWhiskeys, getBlindTastingWithWhiskeys)
- **Issue:** Loop + individual query per whiskey. Flight with 10 whiskeys = 11 DB queries.
- **Fix:** Use JOIN queries instead of Promise.all + map.

### MEDIUM

#### P-3: Missing Pagination on 4+ List Endpoints
- `/api/flights`, `/api/blind-tastings`, `/api/flavors`, `/api/distilleries` return all rows.
- `/api/whiskeys` has hardcoded `.limit(500)` with no offset.
- **Fix:** Add limit/offset to all list endpoints.

#### P-4: React Query staleTime: Infinity Globally
- **File:** `client/src/lib/queryClient.ts:82`
- **Issue:** Data never considered stale. No background refetch.
- **Fix:** Set appropriate stale times (5-10 min for collections).

#### P-5: Images Missing width/height Attributes
- **Files:** WhiskeyCard.tsx, BottleHero.tsx, WhiskeyListView.tsx
- **Issue:** Causes CLS (Cumulative Layout Shift). lazy loading present but no dimensions.
- **Fix:** Add width/height or use CSS aspect-ratio.

---

## AUDIT-008: Pre-Beta Cleanup

### HIGH

#### CL-1: Mock Store Data in Drops Page (Ships to Users)
- **File:** `client/src/pages/Drops.tsx:8-27`
- **Issue:** 3 hardcoded mock store drops. Feature not implemented but fake data shown.
- **Fix:** Either implement the feature or show "Coming Soon" placeholder.

### MEDIUM

#### CL-2: 223 console.log Statements in Production Code
- **Key files:**
  - `server/routes.ts`: 66 instances
  - `server/upc-lookup-service.ts`: 20+ instances
  - `server/image-identify-service.ts`: 12 instances
  - `server/rick-service.ts`: 10 instances
  - `server/elevenlabs-service.ts`: 7 instances
- **Issue:** Project has `server/lib/logger.ts` but most code uses raw console.log.
- **Fix:** Replace console.log with logger in all production server files.

#### CL-3: Localhost URLs in CORS Config (Conditional but Risky)
- **File:** `server/index.ts:76-78`
- **Issue:** Three localhost origins added. Guarded by `if (!isProduction)` — acceptable but worth noting.
- **Status:** Already guarded. No fix needed if NODE_ENV is set correctly in prod.

#### CL-4: 6 Instances of `any` Type
- **Files:** `server/index.ts:146`, `server/routes.ts:394`, `server/reset-database.ts:48,92,113,133`
- **Fix:** Replace with `Error` or `unknown` type.

### LOW

#### CL-5: TODO Comment in Analytics (`client/src/lib/analytics.ts:20`)
#### CL-6: Hardcoded localhost Fallback in Password Reset URL
- **File:** `server/auth/password-reset.ts:40`
- **Issue:** `process.env.APP_URL || 'http://localhost:5000'`
- **Fix:** Require APP_URL in production like SESSION_SECRET.

---

## Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| Main Bundle | 3,460 KB | <1,500 KB |
| Code Splitting | None | 5-7 route chunks |
| N+1 Queries | 2 patterns | 0 |
| List Pagination | 4/8 endpoints | 8/8 |
| Console.log (prod) | 223 | 0 |
| Mock Data | 1 page | 0 pages |
