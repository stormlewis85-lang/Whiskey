# AUDIT-001: End-to-End Feature Walkthrough — Findings

> **Date:** 2026-03-02
> **Test Account:** audittest01 / AuditTest123 (user ID 37)
> **Server:** localhost:5000 (dev mode)
> **Database:** Neon PostgreSQL (production)

---

## CRITICAL — Features Completely Broken

### 1. Flights — 500 on all endpoints
- **Root Cause:** `relation "flights" does not exist` — table never created in database
- **Missing Tables:** `flights`, `flight_whiskeys`
- **Affected Endpoints:** GET /api/flights, POST /api/flights, GET /api/flights/:id, PATCH /api/flights/:id, DELETE /api/flights/:id, POST /api/flights/:id/whiskeys, DELETE /api/flights/:flightId/whiskeys/:fwId, PATCH /api/flights/:flightId/whiskeys/:fwId, POST /api/flights/:id/reorder
- **Repro:** `curl -s http://localhost:5000/api/flights -b <auth_cookie>`
- **Fix:** Run `npm run db:push` to sync schema to database

### 2. Blind Tastings — 500 on all endpoints
- **Root Cause:** `relation "blind_tastings" does not exist` — table never created in database
- **Missing Tables:** `blind_tastings`, `blind_tasting_whiskeys`
- **Affected Endpoints:** GET /api/blind-tastings, POST /api/blind-tastings, GET /api/blind-tastings/:id, DELETE /api/blind-tastings/:id, POST /api/blind-tastings/:btId/whiskeys/:btwId/rate, POST /api/blind-tastings/:id/reveal, POST /api/blind-tastings/:id/complete
- **Repro:** `curl -s http://localhost:5000/api/blind-tastings -b <auth_cookie>`
- **Fix:** Run `npm run db:push` to sync schema to database

### 3. Social/Follow Features — 500 on all endpoints
- **Root Cause:** `relation "follows" does not exist` — table never created in database
- **Missing Table:** `follows`
- **Affected Endpoints:** POST /api/users/:id/follow, DELETE /api/users/:id/follow, GET /api/users/:id/following-status, GET /api/users/:id/followers, GET /api/users/:id/following, GET /api/feed/following, GET /api/users/suggested
- **Repro:** `curl -s http://localhost:5000/api/users/suggested -b <auth_cookie>`
- **Fix:** Run `npm run db:push` to sync schema to database

---

## HIGH — Security Issues

### 4. GET /api/user leaks sensitive fields
- **Issue:** Response includes `authToken`, `tokenExpiry`, `failedLoginAttempts`, `accountLockedUntil`
- **Risk:** Auth token in API response can be captured by XSS or browser extensions. Login attempt data exposes security internals.
- **Repro:** `curl -s http://localhost:5000/api/user -b <auth_cookie>`
- **Fix:** Strip `authToken`, `tokenExpiry`, `failedLoginAttempts`, `accountLockedUntil` from user response serialization

---

## MEDIUM — API Behavior Issues

### 5. Missing API routes fall through to Vite HTML
- **Issue:** Any GET request to a non-existent `/api/*` path returns 200 with HTML instead of 404 JSON. PATCH/DELETE to deleted resources also fall through.
- **Impact:** Frontend gets HTML when expecting JSON, causing silent failures. Makes debugging difficult.
- **Repro:** `curl -s http://localhost:5000/api/community/suggested` (returns HTML)
- **Fix:** Add a catch-all `/api/*` route BEFORE Vite middleware that returns `{ message: "Not found" }` with 404 status

### 6. No export endpoint exists
- **Issue:** No `/api/export` route is registered in the server. Export functionality (if any) must be client-side only or is not implemented.
- **Impact:** Export button in UI (if present) would fail silently
- **Repro:** `curl -s http://localhost:5000/api/export -b <auth_cookie>` (returns HTML)

---

## Database Schema vs Actual Tables

| Schema Table | In Database | Status |
|---|---|---|
| distilleries | YES | OK |
| users | YES | OK |
| oauth_providers | YES | OK |
| password_reset_tokens | YES | OK |
| login_attempts | YES | OK |
| whiskeys | YES | OK |
| **follows** | **NO** | **MISSING** |
| review_comments | YES | OK |
| review_likes | YES | OK |
| price_tracks | YES | OK |
| market_values | YES | OK |
| **flights** | **NO** | **MISSING** |
| **flight_whiskeys** | **NO** | **MISSING** |
| **blind_tastings** | **NO** | **MISSING** |
| **blind_tasting_whiskeys** | **NO** | **MISSING** |
| ai_usage_logs | YES | OK |
| tasting_sessions | YES | OK |
| generated_scripts | YES | OK |
| session (express-session) | YES | OK (not in Drizzle schema) |

**5 of 18 schema tables are missing from the database.**

---

## PASSING — Features Working Correctly

| Feature | Endpoint(s) | Status |
|---|---|---|
| User registration | POST /api/register | PASS |
| User login | POST /api/login | PASS |
| User logout | POST /api/logout | PASS |
| Google OAuth status | GET /api/auth/google | PASS (redirects) |
| Forgot password | POST /api/auth/forgot-password | PASS |
| Get current user | GET /api/user | PASS (security issue noted) |
| Get profile | GET /api/profile | PASS |
| Update profile | PATCH /api/profile | PASS |
| Public profile | GET /api/profile/:slug | PASS (returns 404 if not public) |
| Create whiskey | POST /api/whiskeys | PASS (201) |
| Get whiskeys | GET /api/whiskeys | PASS |
| Get whiskey detail | GET /api/whiskeys/:id | PASS |
| Update whiskey | PATCH /api/whiskeys/:id | PASS |
| Delete whiskey | DELETE /api/whiskeys/:id | PASS (204) |
| Toggle visibility | PATCH /api/whiskeys/:id/visibility | PASS |
| Create review | POST /api/whiskeys/:id/reviews | PASS |
| Update review | PUT /api/whiskeys/:id/reviews/:reviewId | PASS |
| Delete review | DELETE /api/whiskeys/:id/reviews/:reviewId | PASS |
| Review comments | GET /POST /PUT /DELETE comments | PASS |
| Review likes | GET /POST likes | PASS |
| Share review | POST /api/whiskeys/:id/reviews/:reviewId/share | PASS |
| Public reviews | GET /api/reviews/public | PASS |
| Price tracks | GET /POST prices | PASS |
| Market values | GET /POST market-values | PASS |
| Flavors | GET /api/flavors | PASS |
| Community notes | GET /api/whiskeys/:id/community-notes | PASS |
| Palate profile | GET /api/users/:id/palate-profile | PASS |
| Barcode lookup | GET /api/barcode/:code | PASS |
| Import (validation) | POST /api/import | PASS (validates file) |
| Distilleries | GET /api/distilleries | PASS |
| Rick House sessions | GET /api/rick/sessions | PASS |
| Rick start session | POST /api/rick/start-session | PASS |
| AI suggest notes | POST /api/ai/suggest-notes | PASS |
| AI status | GET /api/ai/status | PASS |
| Recommendations | GET /api/recommendations | PASS |
| Similar whiskeys | GET /api/whiskeys/:id/similar | PASS |
| User whiskeys (public) | GET /api/users/:id/whiskeys | PASS |
| All 15 page routes | GET / | PASS (200) |

---

## Summary

- **3 Critical:** Flights, Blind Tastings, and Social/Follow are completely non-functional (missing DB tables)
- **1 High:** Auth token leaked in /api/user response
- **2 Medium:** API catch-all missing (returns HTML for unknown routes), no export endpoint
- **36+ endpoints:** Working correctly

### Recommended Fix Priority
1. **Run `npm run db:push`** to create the 5 missing tables — fixes 3 critical issues at once
2. **Strip sensitive fields** from GET /api/user response
3. **Add API catch-all** route before Vite middleware for proper 404 handling
