# AUDIT-002: Auth & Session Security Review — Findings

> **Date:** 2026-03-02
> **Scope:** All auth flows, session management, JWT/token handling, error messages
> **Files Reviewed:** server/auth.ts, server/auth/*.ts, server/storage.ts, server/lib/crypto.ts, server/lib/errors.ts, shared/schema.ts

---

## Summary

| Severity | Count | Details |
|----------|-------|---------|
| Critical | 0 | — |
| High | 2 | Token stored in DB plaintext, auth token returned in register/login response |
| Medium | 3 | No token expiry check in GET /api/user, session fixation gap, logout doesn't invalidate auth token |
| Low | 3 | Missing CSRF on state-changing deletes, no concurrent session control, register allows empty password |
| Info | 2 | OAuth encryption graceful fallback, cleanup jobs running |

**Previously Fixed (FIX-002):** Sensitive fields (authToken, tokenExpiry, failedLoginAttempts, accountLockedUntil) are now stripped from all user-returning endpoints via `sanitizeUser()`.

---

## HIGH — Security Issues

### H-1: Auth Token Stored Plaintext in Database

- **Location:** `server/storage.ts:178-196` (`generateAuthToken`)
- **Issue:** `authToken` is stored as a raw hex string in the `users.auth_token` column. If the database is compromised (SQL injection, backup leak, admin panel breach), the attacker gets valid auth tokens for every user.
- **Impact:** Full account takeover for any user with an active token.
- **Recommendation:** Hash the token with bcrypt or SHA-256 before storing. Store `hash(token)` in DB, return raw token to client. On lookup, hash the incoming token and compare.
- **Priority:** Fix before public beta. Accept risk for private alpha if timeline is tight.

### H-2: Auth Token Sent in Login/Register Response Body

- **Location:** `server/auth.ts:173-176` (register), `server/auth.ts:250-253` (login)
- **Issue:** Both `POST /api/register` and `POST /api/login` return `{ ...user, token: token }` with the raw auth token in the JSON response body. This token is also stored in a session cookie, so returning it in the body is redundant AND creates exposure — any XSS, browser extension, or HTTP logging/proxy captures the token in plaintext.
- **Impact:** Token theft via XSS or network interception (if TLS is misconfigured).
- **Recommendation:** Remove `token` from the response body. The session cookie (`whiskeypedia.sid`) is already httpOnly and provides authentication. If the mobile app needs a token, deliver it only via a separate secure endpoint or use the httpOnly cookie for all clients.
- **Note:** If token-based auth is required (e.g., for mobile app), consider switching to JWT with short expiry + refresh token rotation, rather than a static DB token.

---

## MEDIUM — Session & Token Issues

### M-1: GET /api/user Token Auth Skips Expiry Check

- **Location:** `server/auth.ts:301-314`
- **Issue:** When authenticating via Bearer token in GET /api/user, there's no check for `tokenUser.tokenExpiry`. The `isAuthenticated` middleware (line 78) does check expiry, but GET /api/user has its own auth logic that skips it.
- **Impact:** Expired tokens can still authenticate on the `/api/user` endpoint.
- **Fix:** Add expiry check: `if (tokenUser.tokenExpiry && new Date(tokenUser.tokenExpiry) < new Date())` before accepting the token.

### M-2: Session Not Regenerated After Login

- **Location:** `server/auth.ts:240-254`
- **Issue:** After successful login, `req.session.userId` is set on the existing session without calling `req.session.regenerate()`. This is a session fixation vulnerability — if an attacker can set a session cookie before login (e.g., via a subdomain), they retain access after the user authenticates.
- **Impact:** Session fixation attack possible if attacker can inject a session ID.
- **Recommendation:** Call `req.session.regenerate()` after successful login and OAuth callback, then set `userId` on the new session.

### M-3: Logout Doesn't Invalidate Auth Token

- **Location:** `server/auth.ts:268-275`
- **Issue:** `POST /api/logout` only destroys the session. The `authToken` in the database remains valid. Any client that saved the Bearer token can still authenticate after logout.
- **Impact:** Logout doesn't fully revoke access.
- **Fix:** On logout, also clear the user's `authToken` and `tokenExpiry` in the database.

---

## LOW — Minor Issues

### L-1: DELETE Endpoints Accept Body Without CSRF Protection

- **Location:** `DELETE /api/auth/oauth/:provider` (auth.ts:505), `DELETE /api/account` (auth.ts:548)
- **Issue:** These destructive endpoints rely on password confirmation in the request body, which is good. However, there's no CSRF token validation beyond `sameSite: lax`. While `lax` prevents cross-site POSTs, DELETE methods from third-party forms are blocked by browsers, so risk is low.
- **Impact:** Minimal with `sameSite: lax` and password confirmation.
- **Note:** Acceptable for current threat model. Consider adding CSRF tokens if the app moves to `sameSite: none` for any reason.

### L-2: No Concurrent Session Control

- **Issue:** A user can have unlimited simultaneous sessions from different devices. There's no way to see or revoke active sessions.
- **Impact:** If credentials are compromised, user can't revoke attacker's session.
- **Recommendation:** (Future feature) Add a "View active sessions" / "Revoke all sessions" feature to user settings.

### L-3: Registration Allows Empty Password String

- **Location:** `server/auth.ts:154-159`
- **Issue:** `password: validatedData.password || ''` — if the user provides no password (which is valid per schema since it's optional for OAuth), the password is set to empty string `''`. This is then hashed by bcrypt, creating a valid password hash for an empty string. The user could later log in with an empty password.
- **Impact:** OAuth users who don't set a password end up with an empty-string password that technically validates.
- **Fix:** Use `null` instead of `''` when no password is provided: `password: validatedData.password || null`. The existing OAuth user detection (`if (!user.password)`) already handles `null` correctly.

---

## INFO — Positive Findings

### I-1: OAuth Token Encryption Gracefully Degrades

- **Location:** `server/lib/crypto.ts`
- **Finding:** OAuth access/refresh tokens are encrypted with AES-256-GCM when `OAUTH_ENCRYPTION_KEY` is set. If not set, tokens are stored plaintext with a backwards-compatible fallback. This is well-designed for progressive hardening.
- **Action:** Ensure `OAUTH_ENCRYPTION_KEY` is set in production `.env`.

### I-2: Security Infrastructure Is Solid

- **Positive patterns observed:**
  - Password hashing with bcrypt via `hashPassword()`
  - Account lockout after 5 failed attempts (30-minute lockout)
  - Rate limiting on login (5/15min), registration (5/hr), password reset (3/hr)
  - Global API rate limit (100/min per IP)
  - Password strength requirements (uppercase, lowercase, number, 8+ chars)
  - Forgot-password returns generic message (prevents email enumeration)
  - Reset tokens: 64-char nanoid, 1-hour expiry, single-use
  - Password change invalidates auth token
  - Password reset invalidates auth token
  - Session: httpOnly, secure in prod, sameSite=lax, 30-day expiry
  - `safeError()` sanitizes error messages in 500 responses
  - OAuth state parameter for CSRF protection
  - Trust-proxy only in production
  - SESSION_SECRET required in production (random fallback in dev)
  - Helmet security headers configured
  - CSP directives set

---

## Known Bug Investigation: Delete Session Token Bug

Per CLAUDE.md: "Known issue: delete operations may have session token bugs."

### Investigation:

Examined `DELETE /api/account` (auth.ts:548-603):

1. User is authenticated via `isAuthenticated` middleware
2. Password confirmation is required (if user has a password)
3. Images cleaned up from Spaces
4. User row deleted (CASCADE handles all related data)
5. Session destroyed

**Finding:** The delete flow itself appears correct. The session is properly destroyed after account deletion. However, there are two potential issues:

1. **Race condition:** `req.session.destroy()` is called but its callback only logs errors — it doesn't wait for completion before sending `res.json()`. In practice, Express sends the response before the session is fully cleaned up. This is mostly harmless since the user row is already deleted.

2. **Auth token not cleared:** If the client stored the Bearer token, the token is still in the user record... but the user record is deleted via CASCADE, so the token becomes invalid. This is fine.

3. **The real session token bug** is likely the broader issue documented in M-3: `POST /api/logout` doesn't invalidate the auth token. When combined with `DELETE /api/whiskeys/:id` (which uses `isAuthenticated`), a logged-out user's Bearer token still works. This is the most likely source of the reported bug.

**Verdict:** The "session token bug" is M-3 (logout doesn't invalidate token). Documented above with fix recommendation.

---

## Recommended Fix Priority

### Must-fix before beta:
1. **M-1:** Add token expiry check in GET /api/user (5 min fix)
2. **M-3:** Invalidate auth token on logout (5 min fix)
3. **L-3:** Use `null` instead of `''` for missing passwords (1 min fix)

### Should-fix before beta:
4. **M-2:** Regenerate session on login (10 min fix)
5. **H-2:** Remove token from login/register response body (need to verify no client code depends on it)

### Fix before public launch:
6. **H-1:** Hash auth tokens before storing in database

### Future backlog:
7. **L-2:** Session management UI (view/revoke sessions)
