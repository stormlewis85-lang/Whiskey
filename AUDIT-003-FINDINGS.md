# AUDIT-003: Database & API Integrity Check — Findings

> **Date:** 2026-03-02
> **Scope:** Schema/ORM alignment, API error handling, SQL injection vectors, data integrity

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 3 |
| Medium | 3 |
| Low | 2 |

---

## CRITICAL

### C-1: Missing Whiskey Ownership Check in addWhiskeyToFlight
- **File:** `server/storage.ts` (addWhiskeyToFlight)
- **Issue:** Flight ownership is verified but the whiskey being added is NOT verified to belong to the user. User A can add User B's whiskey to their flight.
- **Fix:** Add `getWhiskey(whiskeyId, userId)` ownership check before insert.

### C-2: Blind Tasting Whiskeys Not Validated for Ownership
- **File:** `server/storage.ts` (createBlindTasting)
- **Issue:** Accepts array of `whiskeyIds` and directly inserts without verifying ownership. Users can create blind tastings with other users' whiskeys.
- **Fix:** Validate each whiskeyId belongs to the user before creating.

### C-3: Unbounded List Endpoints (DoS Risk)
- **Files:** `server/storage.ts` (getPublicReviews, getFollowingFeed), `server/routes.ts`
- **Issue:** Multiple endpoints load ALL records into memory then slice in JS. No server-side pagination max. Client-provided `limit` parameter has no ceiling.
- **Fix:** Add `Math.min(limit, 100)` caps on all list endpoints. Refactor to use DB-level LIMIT/OFFSET.

---

## HIGH

### H-1: No Upper Limit on Query Parameters
- **File:** `server/routes.ts` (multiple lines)
- **Issue:** `limit` and `offset` query params accept any value. `GET /api/reviews/public?limit=999999` loads unbounded data.
- **Fix:** `const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 20), 100);`

### H-2: JSONB Notes Field Lacks Storage Layer Validation
- **File:** `server/storage.ts` (addReview, updateReview)
- **Issue:** Routes use Zod validation, but storage layer accepts raw ReviewNote without re-validation. Bypassing the route layer could inject malformed data.
- **Fix:** Add `reviewNoteSchema.parse(review)` at storage layer as defense-in-depth.

### H-3: Session userId Capture Inconsistency in Delete Operations
- **File:** `server/routes.ts` (DELETE endpoints)
- **Issue:** Some delete routes use `req.session?.userId` after auth middleware. If session is invalidated between middleware and handler, userId becomes undefined.
- **Fix:** Use `getUserId(req)` consistently (throws on missing userId).

---

## MEDIUM

### M-1: Missing LIMIT on Distillery Search Results
- **File:** `server/storage.ts` (getDistilleries)
- **Issue:** Search query returns unbounded results. Broad search (e.g., `search="a"`) returns all distilleries.
- **Fix:** Add `.limit(50)` to distillery search.

### M-2: Missing Validation on Tasting Session Phase Names
- **File:** `server/routes.ts` (PATCH /api/rick/session/:id)
- **Issue:** `currentPhase` from req.body not validated against allowed phase names.
- **Fix:** Validate against `['introduction', 'nose', 'palate', 'finish', 'value']`.

### M-3: Race Condition in Script Cache Invalidation
- **File:** `server/storage.ts` (getCachedScript)
- **Issue:** TOCTOU race between checking review count and returning cache. Low real-world impact.
- **Fix:** Accept as known limitation or add version field.

---

## LOW

### L-1: Silent Error Catch in Token Generation (auth.ts register)
### L-2: Inconsistent parseInt Validation Pattern

---

## Positive Findings

- No SQL injection vectors found — all Drizzle ORM queries use parameterized statements
- Zod schema validation on all major routes
- Authentication middleware properly applied
- `safeError()` wrapper prevents stack traces in responses
- Password hashing with scrypt + timing-safe comparison
