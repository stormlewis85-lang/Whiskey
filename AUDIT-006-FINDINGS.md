# AUDIT-006: Error Handling & Edge Cases — Findings

> **Date:** 2026-03-02
> **Scope:** Error boundaries, loading/error/empty states, try/catch coverage, edge cases

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 3 |
| Low | 6 |

**Overall Grade: B+** — Strong error handling with minor improvements needed.

---

## MEDIUM

### M-1: No Top-Level Error Boundary in App.tsx
- **File:** `client/src/App.tsx`
- **Issue:** Errors in AuthProvider, ThemeProvider, or QueryClientProvider crash the entire app. Only Router has RouteErrorBoundary.
- **Fix:** Wrap entire App with a top-level ErrorBoundary component.

### M-2: getUserId Throws Generic Error Instead of 401
- **File:** `server/routes.ts:267`
- **Issue:** `getUserId()` throws `Error("User not authenticated")` which gets caught as 500 instead of 401.
- **Fix:** Throw with status: `throw { status: 401, message: "Not authenticated" }` and handle in catch.

### M-3: Missing NaN Check in useWhiskeyCollection
- **File:** `client/src/lib/hooks/useWhiskeyCollection.ts:82`
- **Issue:** `parseInt(ratingFilter)` may return NaN, causing `rating >= NaN` to always be false, hiding all whiskeys.
- **Fix:** Add `if (isNaN(minRating)) return true` guard.

---

## LOW

### L-1: Promise.all Instead of Promise.allSettled for User Lookups
- **File:** `server/routes.ts:864` — One failed getUser rejects entire comment response
### L-2: Export Error Message Not Shown to User (ExportModal.tsx:70)
### L-3: Missing Frontend File Size Validation (ImportModal.tsx:54)
### L-4: Review ID Type Inconsistency (String vs Number in routes.ts)
### L-5: Array .at(-1) Clarity (Home.tsx:95)
### L-6: Date Validation in Sort (useWhiskeyCollection.ts:161)

---

## Positive Findings

- Comprehensive try/catch blocks in all route handlers
- Zod schema validation throughout
- RouteErrorBoundary for route rendering errors
- Proper loading/error/empty state handling in components
- Mutation isPending guards prevent double-submit on all forms
- React Query configured with retry: false (safe for mutations)
- Image magic byte validation on uploads
- 401 responses properly detected in queryClient
