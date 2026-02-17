# MyWhiskeyPedia Security Audit

**Date:** February 17, 2026
**Auditor:** Claude Code (Opus 4.6)
**Scope:** Full-stack application — server, client, database, dependencies
**Application:** MyWhiskeyPedia (whiskey collection management platform)

---

## Executive Summary

Overall security posture: **GOOD foundation** with one **CRITICAL** issue (exposed credentials in git) and several HIGH-priority items to fix before launch.

The application implements solid security fundamentals: proper password hashing, session management, input validation, SQL injection prevention via ORM, rate limiting on auth endpoints, and account lockout. However, the `.env` file containing all production secrets has been committed to git history, and several other gaps need attention before real users trust this app with their data.

| Severity | Count | Summary |
|----------|-------|---------|
| CRITICAL | 1 | `.env` with all secrets committed to git history |
| HIGH | 3 | Error info leakage, session secret fallback, no account deletion |
| MEDIUM | 8 | No global rate limiting, SameSite cookie config, cleanup jobs missing, etc. |
| LOW | 7 | Console.log in production, unsafe-inline CSP, token in localStorage, etc. |

---

## 1. Authentication

### What auth system is used?

**Hybrid session + bearer token system** with optional Google OAuth.

| Component | Technology |
|-----------|-----------|
| Sessions | `express-session` + `connect-pg-simple` (PostgreSQL store) |
| Tokens | Custom opaque bearer tokens (NOT JWT) |
| OAuth | Google OAuth 2.0 (manual implementation, not Passport strategies) |
| Password hashing | Node.js `crypto.scrypt` with timing-safe comparison |

### Are sessions secure?

| Cookie Setting | Value | Status |
|---------------|-------|--------|
| `httpOnly` | `true` (always) | PASS |
| `secure` | `true` in production, `false` in dev | PASS |
| `sameSite` | `"none"` in production, `"lax"` in dev | WARN (see AUTH-2) |
| `name` | `whiskeypedia.sid` (custom, not default) | PASS |
| `path` | `/` | PASS |
| Store | PostgreSQL (persistent across restarts) | PASS |
| `rolling` | `true` (extends on each request) | PASS |

**File:** `server/auth.ts` lines 93-114

### Session expiration/timeout?

| Setting | Value | Status |
|---------|-------|--------|
| Session maxAge | 30 days | PASS |
| Rolling sessions | Enabled (extends on each request) | PASS |
| Bearer token expiry | Has `tokenExpiry` field, checked on auth | PASS |
| Password reset token | 1 hour expiry, one-time use | PASS |

### Password hashing algorithm?

**scrypt** (Node.js built-in `crypto` module) - PASS

```
Algorithm:  scrypt (NIST-recommended, GPU/ASIC resistant)
Salt:       16 random bytes (crypto.randomBytes)
Key length: 64 bytes
Comparison: crypto.timingSafeEqual (prevents timing attacks)
Format:     {hex_hash}.{hex_salt}
```

**File:** `server/storage.ts` lines 34-45

### Rate limiting on login attempts?

**Yes** - custom database-backed rate limiting.

| Endpoint | Limit | Window | Identifier |
|----------|-------|--------|-----------|
| `POST /api/login` | 5 attempts | 15 minutes | Username or IP |
| `POST /api/register` | 5 attempts | 1 hour | IP address |
| `POST /api/auth/forgot-password` | 3 attempts | 1 hour | Email or IP |

**Account lockout:** 5 failed attempts = 30-minute lockout. Tracked in DB (`failedLoginAttempts`, `accountLockedUntil`). Resets on successful login or password reset.

**Files:** `server/auth/rate-limiter.ts`, `server/auth/account-security.ts`

### Authentication Findings

| ID | Severity | Finding |
|----|----------|---------|
| AUTH-1 | **HIGH** | **Session secret has unsafe fallback.** `server/auth.ts:95` — `secret: process.env.SESSION_SECRET \|\| nanoid(32)`. If `SESSION_SECRET` is not set, a random secret is generated on every startup. All existing sessions become invalid after a restart, and in a multi-instance deployment, sessions won't be shared. **Fix: Throw an error in production if not set.** |
| AUTH-2 | **MEDIUM** | **SameSite "none" in production.** `server/auth.ts:110` — `sameSite: isProduction ? "none" : "lax"`. `SameSite=None` is the **least restrictive** setting — the cookie is sent on all cross-site requests. If the frontend and backend are on the same domain (`mywhiskeypedia.com`), this should be `"lax"`. `SameSite=None` only makes sense if the API is on a different domain than the frontend. |
| AUTH-3 | **LOW** | **Auth token stored in localStorage.** `client/src/hooks/use-auth.tsx:24-27` — Bearer tokens stored in `localStorage`. If an XSS vulnerability is ever introduced, localStorage is readable by any script. The httpOnly session cookie is the primary auth mechanism and is not exposed, so blast radius is limited. Consider relying solely on the session cookie. |
| AUTH-4 | **LOW** | **No authenticated password change.** Users can only change their password via the email reset flow. No endpoint exists for changing password while logged in (Settings > Change Password). |

### Authentication Strengths
- PASS: Strong password hashing with scrypt + timing-safe comparison
- PASS: httpOnly cookies prevent XSS token theft
- PASS: Account lockout after failed attempts
- PASS: Rate limiting on all auth endpoints
- PASS: Password reset tokens expire in 1 hour, single-use
- PASS: Email enumeration prevented (reset always returns success)
- PASS: OAuth CSRF protection via state parameter (`nanoid(32)`)
- PASS: Tokens invalidated after password reset
- PASS: No 2FA/MFA (not a vulnerability, but a future enhancement)

---

## 2. Authorization

### Are all API routes protected?

**Yes.** All data-mutating and user-specific routes require `isAuthenticated` middleware. 146 occurrences of auth checks in `routes.ts`.

**Protected routes (require auth):**
- All whiskey CRUD (`/api/whiskeys/*`)
- All review CRUD (`/api/whiskeys/:id/reviews/*`)
- All price/market value operations
- All flights and blind tastings
- Profile updates, image uploads
- AI endpoints
- Import endpoint
- Follow/unfollow, comments, likes

**Public routes (intentionally open):**
- `GET /api/shared/:shareId` — shared public reviews
- `GET /api/reviews/public` — public review feed
- `GET /api/profile/:slug` — public profiles
- `GET /api/distilleries` — distillery directory
- `GET /api/users/:id/followers` and `/following` — social counts

### Can User A access User B's bottles/reviews?

**No.** All data access is filtered by userId at the storage layer.

| Operation | Isolation Method | Status |
|-----------|-----------------|--------|
| Get whiskeys | `WHERE userId = req.session.userId` | PASS |
| Update whiskey | `WHERE id = :id AND userId = :userId` | PASS |
| Delete whiskey | `WHERE id = :id AND userId = :userId` | PASS |
| Add review | Validates whiskey ownership first | PASS |
| Update/delete review | Validates whiskey ownership first | PASS |
| Update/delete comment | `WHERE userId = getUserId(req)` | PASS |
| Flights | `WHERE userId = getUserId(req)` | PASS |
| Blind tastings | `WHERE userId = getUserId(req)` | PASS |
| Price history | `WHERE userId = getUserId(req)` | PASS |

### Is userId validated on every request?

**Yes.** `getUserId(req)` extracts userId from `req.session.userId` (set by auth middleware after DB validation). The userId is **never** taken from request body or URL params for authorization. **File:** `server/routes.ts` lines 34-40

### Are there admin routes?

**One hardcoded admin check found:**
- `userId === 1` in `storage.ts:388,414` — admin user can see legacy whiskeys with NULL userId (migration support)

| ID | Severity | Finding |
|----|----------|---------|
| AUTHZ-1 | **LOW** | **Hardcoded admin ID.** `storage.ts:388` — `userId === 1` is a magic number. Should be an environment variable or a roles column in the users table. |
| AUTHZ-2 | **LOW** | **No re-authentication for sensitive operations.** Deleting bottles, changing email, or unlinking OAuth doesn't require re-entering a password. If a session is hijacked, the attacker can perform all operations. |

---

## 3. Input Validation & Sanitization

### Server-side validation?

**Yes — comprehensive Zod schema validation on all endpoints.**

| Data Type | Schema | Validation |
|-----------|--------|-----------|
| Registration | `registerUserSchema` | Username regex, password complexity (8+ chars, upper/lower/number), email format |
| Whiskeys | `insertWhiskeySchema` | Type coercion, required fields, enum constraints |
| Reviews | `reviewNoteSchema` | Rating ranges (0-5), component scores |
| Comments | `insertCommentSchema` | Required content field |
| Profile | `updateProfileSchema` | Bio length, slug format |
| Excel import | `excelImportSchema` | Row-by-row validation |
| Password reset | `resetPasswordSchema` | Token + password complexity |

Every POST/PATCH endpoint calls `.parse(req.body)` with structured error responses on failure.

### SQL injection protection?

**NOT VULNERABLE** — Drizzle ORM with parameterized queries throughout.

- All queries use Drizzle's type-safe query builder (`eq()`, `and()`, `ilike()`)
- No raw SQL string concatenation detected
- Search queries use `ilike()` with automatic escaping
- Tagged template SQL (e.g., in rate limiter) uses parameter binding

### XSS protection?

| Protection | Status |
|-----------|--------|
| React auto-escaping | PASS — all user content rendered as text nodes |
| `dangerouslySetInnerHTML` | NOT USED |
| Content stored as plain text | PASS — no HTML in database |
| Helmet CSP headers | PASS — configured |
| JSON API responses | PASS — no HTML rendering server-side |

### File upload validation?

| Check | Value | Status |
|-------|-------|--------|
| MIME whitelist | `image/jpeg`, `image/png`, `image/gif`, `image/webp` | PASS |
| Max file size (images) | 10 MB | PASS |
| Max file size (Excel) | 5 MB | PASS |
| Filename | Discarded; replaced with `bottle-temp-{timestamp}-{random}` | PASS |
| Processing | Sharp: auto-rotate, resize max 1600px, convert to WebP | PASS |
| Temp cleanup | Deleted after processing | PASS |
| Ownership check | Validates whiskey belongs to user before upload | PASS |

| ID | Severity | Finding |
|----|----------|---------|
| INPUT-1 | **LOW** | **No magic byte validation on uploads.** MIME type checked by Content-Type header only, which can be spoofed. Sharp will reject non-images during processing, providing a secondary check, but explicit file signature validation adds defense in depth. |

---

## 4. API Security

### CORS configuration?

**Whitelist-based — PASS**

```
Production origins:
  https://mywhiskeypedia.com
  https://www.mywhiskeypedia.com

Development only (added when NODE_ENV !== 'production'):
  http://localhost:5000
  http://localhost:5173
  http://localhost:3000
```

- Not using wildcard (`*`) — PASS
- Credentials allowed (`Access-Control-Allow-Credentials: true`) — PASS
- Dev origins excluded in production — PASS
- Preflight (OPTIONS) handled — PASS

**File:** `server/index.ts` lines 53-78

### API keys/secrets in environment variables?

**All secrets loaded from `process.env` via dotenv** — PASS in code.

| Secret | In env var? | Hardcoded? |
|--------|-----------|------------|
| `DATABASE_URL` | Yes (throws if missing) | No |
| `SESSION_SECRET` | Yes (with fallback) | No |
| `ANTHROPIC_API_KEY` | Yes | No |
| `GOOGLE_CLIENT_ID/SECRET` | Yes | No |
| `SPACES_ACCESS_KEY/SECRET_KEY` | Yes | No |
| `RESEND_API_KEY` | Yes | No |
| `ELEVENLABS_API_KEY` | Yes | No |

### CRITICAL: .env committed to git

| ID | Severity | Finding |
|----|----------|---------|
| ENV-1 | **CRITICAL** | **`.env` is NOT in `.gitignore` and has been committed to the repository.** Git history confirms the `.env` file was added. This means ALL production secrets (database URL, API keys, OAuth secrets, session secret, S3 credentials) are exposed in the git history. Even if `.env` is added to `.gitignore` now, the secrets remain in history. |

**`.gitignore` contents (no `.env` entry):**
```
node_modules
dist
.DS_Store
server/public
vite.config.ts.*
*.tar.gz
uploads/
nul
```

**IMMEDIATE ACTION REQUIRED:**
1. Add `.env` to `.gitignore`
2. **Rotate ALL credentials** — every API key, database password, OAuth secret, session secret
3. Use `git filter-branch` or [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) to remove `.env` from git history
4. If the repo was ever public or shared, consider all credentials compromised NOW

### HTTPS enforcement?

- `trust proxy` set to `1` in production — PASS
- Secure cookies in production — PASS
- No explicit HTTP-to-HTTPS redirect found (may be handled by hosting/reverse proxy)

### Security headers (Helmet)?

```
defaultSrc:  ['self']
scriptSrc:   ['self']
styleSrc:    ['self', 'unsafe-inline', 'fonts.googleapis.com']
imgSrc:      ['self', 'data:', 'blob:', DigitalOcean Spaces CDN]
connectSrc:  ['self', DigitalOcean Spaces CDN]
fontSrc:     ['self', 'data:', 'fonts.gstatic.com']
objectSrc:   ['none']
frameSrc:    ['none']
mediaSrc:    ['self', 'blob:']
```

### Sensitive data in API responses?

Password hashes properly excluded from all responses:
```typescript
const { password, ...userWithoutPassword } = user;
res.json(userWithoutPassword);
```
- PASS: Passwords never sent to client
- PASS: Auth tokens only returned on login/register

| ID | Severity | Finding |
|----|----------|---------|
| API-1 | **MEDIUM** | **No explicit HSTS header.** Should verify `Strict-Transport-Security: max-age=31536000; includeSubDomains` is active. Helmet sets this by default but explicit configuration is recommended. |
| API-2 | **LOW** | **`'unsafe-inline'` in style CSP.** Required for Tailwind but weakens CSP. Consider nonce-based approach in the future. |

---

## 5. Database Security

### Connection using SSL?

**PASS** — Neon PostgreSQL enforces SSL by default. Connection string uses `sslmode=require`.

### Credentials in environment variables?

**PASS** (in code) — `DATABASE_URL` loaded from `process.env`. Throws if missing (`server/db.ts:8-12`).

**FAIL** (in practice) — `.env` committed to git (see Section 4 ENV-1).

### Sensitive data encryption at rest?

| Data | Storage Method | Status |
|------|---------------|--------|
| Passwords | scrypt hash + unique 16-byte salt | PASS |
| Session data | PostgreSQL (server-side) | PASS |
| Auth tokens | DB with expiry timestamp | PASS |
| Reset tokens | DB with `usedAt` + `expiresAt` | PASS |
| OAuth access/refresh tokens | **Plaintext in DB** | WARN |
| User PII (email, name) | Plaintext | Standard |

| ID | Severity | Finding |
|----|----------|---------|
| DB-1 | **MEDIUM** | **OAuth tokens stored as plaintext.** `oauthProviders` table stores Google `accessToken` and `refreshToken` as plain text. If the database is compromised, these tokens could access users' Google accounts. Consider application-level encryption at rest. |

---

## 6. Dependencies

### npm audit results — 9 vulnerabilities

```
9 vulnerabilities (1 low, 6 moderate, 1 high, 1 critical)
```

| Package | Severity | Issue | Fix Available? |
|---------|----------|-------|----------------|
| **jspdf** <=4.0.0 | **CRITICAL** | Local File Inclusion (GHSA-f8cm-6447-x5h2), PDF Injection / arbitrary JS execution (GHSA-pqxr-3g65-p328), DoS via BMP (GHSA-95fx-jjr5-f39c), XMP Metadata Injection (GHSA-vm32-vv63-w422), Race Condition (GHSA-cjw8-79x6-5cj4) | Yes — upgrade to jspdf@4.1.0 (breaking) |
| **xlsx** * | **HIGH** | Prototype Pollution (GHSA-4r6h-8v6p-xvw6), ReDoS (GHSA-5pgg-2g8v-p4x9) | **No fix available** |
| **qs** 6.7.0-6.14.1 | **LOW** | arrayLimit bypass DoS (GHSA-w7fw-mjwx-w883) | Yes — `npm audit fix` |
| **esbuild** <=0.24.2 | **MODERATE** | Dev server request interception (GHSA-67mh-4wv8-2f99) — 6 instances via vite, drizzle-kit | Upgrade vite to 7.x (breaking) |

### Key dependency versions

```
express:           ^4.21.2   (current)
helmet:            ^8.1.0    (current)
express-session:   ^1.18.1   (current)
zod:               ^3.24.2   (current)
drizzle-orm:       ^0.39.1   (current)
@anthropic-ai/sdk: ^0.71.2   (current)
sharp:             ^0.34.5   (current)
```

| ID | Severity | Finding |
|----|----------|---------|
| DEP-1 | **HIGH** | **jspdf has 5 CRITICAL/HIGH CVEs** including Local File Inclusion and arbitrary JS execution. Used for PDF export. **Upgrade to jspdf@4.1.0.** |
| DEP-2 | **MEDIUM** | **xlsx has HIGH vulnerabilities with no fix.** Prototype Pollution and ReDoS. Used for Excel import. Switch to a maintained alternative like `exceljs`. |
| DEP-3 | **LOW** | **qs DoS vulnerability.** Quick fix: `npm audit fix`. |
| DEP-4 | **LOW** | **esbuild/vite moderate vulnerabilities.** Dev-only tools — lower risk in production builds. Upgrade when convenient. |

---

## 7. Error Handling

### Do error messages leak sensitive info?

**YES — FAIL.** 80+ endpoints return raw error strings to clients.

Pattern found throughout `server/routes.ts`:
```typescript
catch (error) {
  res.status(500).json({ message: "Failed to...", error: String(error) });
}
```

`String(error)` can expose:
- Stack traces with file paths
- Database error messages with table/column names
- Internal library error details
- Connection strings or configuration info

**Also:** The global error handler re-throws errors (`server/index.ts:133`):
```typescript
app.use((err, _req, res, _next) => {
  res.status(status).json({ message });
  throw err;  // Re-throws — may crash process in production
});
```

### Is there proper error logging?

**No.** 249 `console.log/error/warn` calls across 21 server files. No structured logging library.

**Examples of sensitive data being logged:**
- `server/auth.ts:273` — `Session auth: user ${username} (ID: ${id})`
- `server/auth.ts:309` — `No valid session or token found`
- `server/auth/password-reset.ts:23` — `Password reset requested for unknown email: ${email}`
- `server/auth/oauth-google.ts:269` — `Google OAuth: ${email} (${googleId})`

| ID | Severity | Finding |
|----|----------|---------|
| ERR-1 | **HIGH** | **Error details leaked to clients in every 500 response.** 80+ instances of `String(error)` sent to users. An attacker could trigger errors intentionally to map the backend. **Fix: Return only `{ message: "Internal server error" }` in production. Log the full error server-side.** |
| ERR-2 | **MEDIUM** | **249 console.log calls across server with sensitive data.** Replace with structured logger (`pino` or `winston`) with log levels. Ensure PII (emails, usernames, IPs) is not logged at INFO level in production. |

---

## 8. Rate Limiting

### Auth endpoint rate limiting?

**PASS** — See Section 1.

### General API rate limiting?

**FAIL — No rate limiting on data creation or AI endpoints.**

| Endpoint | Rate Limited? | Risk |
|----------|--------------|------|
| `POST /api/login` | YES (5/15min) | Low |
| `POST /api/register` | YES (5/hr) | Low |
| `POST /api/auth/forgot-password` | YES (3/hr) | Low |
| `POST /api/whiskeys` | **NO** | Unlimited bottle creation |
| `POST /api/whiskeys/:id/reviews` | **NO** | Unlimited reviews |
| `POST /api/whiskeys/:id/reviews/:id/comments` | **NO** | Unlimited comments |
| `POST /api/whiskeys/:id/image` | **NO** | Unlimited image uploads (10MB each) |
| `POST /api/flights` | **NO** | Unlimited flights |
| `POST /api/import` | **NO** | Unlimited Excel imports |
| `POST /api/ai/suggest-notes` | **NO** | Burns Anthropic API credits |
| `POST /api/ai/enhance-notes` | **NO** | Burns Anthropic API credits |

### Brute force protection?

- Login: YES (rate limiting + account lockout) — PASS
- Password reset: YES (rate limiting) — PASS
- Other endpoints: NO

| ID | Severity | Finding |
|----|----------|---------|
| RATE-1 | **MEDIUM** | **No global API rate limiting.** An authenticated user could spam creation endpoints or burn AI API credits. **Add `express-rate-limit`** (e.g., 100 req/min per user globally, 20/hour on AI endpoints). |
| RATE-2 | **MEDIUM** | **Rate limit cleanup never runs.** `cleanupOldAttempts()` defined in `rate-limiter.ts:74` but **never called**. `loginAttempts` table grows unbounded. Similarly, `cleanupExpiredTokens()` in `password-reset.ts:144` is never called. **Add a `setInterval` on startup** to run these hourly. |
| RATE-3 | **LOW** | **Rate limiter fails open.** `rate-limiter.ts:46-48` — if the DB query fails, the request is allowed through. Reasonable for availability but means a DB outage disables rate limiting. |

---

## 9. Data Privacy

### What user data is collected?

| Category | Fields |
|----------|--------|
| Identity | username, email, displayName, firstName, lastName |
| Auth | password (hashed), authToken (hashed), OAuth tokens |
| Profile | bio, profileImage, profileSlug, isPublic |
| Security | failedLoginAttempts, accountLockedUntil, lastLoginAt |
| Activity | whiskeys, reviews, comments, likes, flights, blind tastings, prices |
| Logging | IP address (in loginAttempts table) |

### Is any data shared with third parties?

| Service | Data Sent | Purpose |
|---------|-----------|---------|
| **Anthropic Claude API** | Whiskey name, distillery, type, age, ABV, price, flavor aggregates | AI tasting notes |
| **DigitalOcean Spaces** | Bottle images only | Image storage/CDN |
| **Resend** | User email address | Password reset emails |
| **Google OAuth** | Standard OAuth flow | Authentication |
| **ElevenLabs** | Generated text scripts | Text-to-speech |

NOT sent to third parties: usernames, passwords, individual review text, purchase history.

### Can users delete their account and data?

**NO.**

| ID | Severity | Finding |
|----|----------|---------|
| PRIV-1 | **HIGH** | **No account deletion capability.** No `DELETE /api/account` endpoint exists. With real users, this is a privacy concern and potentially a **legal requirement** (GDPR Article 17 "Right to Erasure", CCPA). The database uses CASCADE deletes, so implementation is straightforward: delete the user row + uploaded images from S3. |
| PRIV-2 | **MEDIUM** | **No privacy policy.** Collecting user data (especially with Google OAuth and third-party API calls) requires a privacy policy explaining what's collected, how it's used, and how users can request deletion. |
| PRIV-3 | **LOW** | **IP addresses stored indefinitely.** The `loginAttempts` table stores IP addresses but cleanup never runs (see RATE-2). |

---

## 10. Production Checklist

### Already Secure
- [x] Passwords hashed with scrypt + per-user salt + timing-safe comparison
- [x] httpOnly cookies for sessions
- [x] Secure cookies in production (HTTPS only)
- [x] Sessions stored in PostgreSQL (persistent across restarts)
- [x] Input validation with Zod on all POST/PATCH endpoints
- [x] SQL injection prevented (Drizzle ORM parameterized queries)
- [x] XSS mitigated (React escaping + CSP headers + JSON-only API)
- [x] CORS origin whitelist (not wildcard)
- [x] Rate limiting on all auth endpoints
- [x] Account lockout after 5 failed login attempts
- [x] Password reset tokens are single-use and expire in 1 hour
- [x] Email enumeration prevented on password reset
- [x] OAuth CSRF protection (state parameter)
- [x] File upload type/size validation with server-side processing
- [x] All API keys in environment variables (not hardcoded)
- [x] Helmet.js security headers with CSP
- [x] Password hashes excluded from all API responses
- [x] Token invalidation after password reset
- [x] Database SSL enforced (Neon)
- [x] User data isolation (userId in all queries)

### CRITICAL — Do Immediately
- [ ] **Add `.env` to `.gitignore`** (ENV-1)
- [ ] **Rotate ALL secrets** — every key/password/secret is compromised (ENV-1)
- [ ] **Remove `.env` from git history** with BFG Repo Cleaner (ENV-1)

### HIGH — Fix Before Launch
- [ ] **Stop leaking `String(error)` to clients** — return generic 500 messages (ERR-1)
- [ ] **Enforce `SESSION_SECRET`** — throw in production if not set (AUTH-1)
- [ ] **Add account deletion endpoint** — legal requirement with real users (PRIV-1)
- [ ] **Upgrade jspdf to 4.1.0** — 5 CVEs including arbitrary JS execution (DEP-1)
- [ ] **Run `npm audit fix`** for qs vulnerability (DEP-3)

### MEDIUM — Fix Soon After Launch
- [ ] Change `sameSite` to `"lax"` if same-domain deployment (AUTH-2)
- [ ] Add global API rate limiting with `express-rate-limit` (RATE-1)
- [ ] Add periodic cleanup for `loginAttempts` and expired tokens (RATE-2)
- [ ] Replace `xlsx` with maintained alternative like `exceljs` (DEP-2)
- [ ] Add explicit HSTS header (API-1)
- [ ] Encrypt OAuth tokens at rest (DB-1)
- [ ] Replace `console.log` with structured logger (ERR-2)
- [ ] Add privacy policy page (PRIV-2)

### LOW — Nice to Have
- [ ] Add password change endpoint while authenticated (AUTH-4)
- [ ] Add magic byte validation for file uploads (INPUT-1)
- [ ] Require re-authentication for destructive actions (AUTHZ-2)
- [ ] Move localStorage token to httpOnly cookie or remove (AUTH-3)
- [ ] Move admin userId to env var or roles table (AUTHZ-1)
- [ ] Add CSP nonce-based style loading (API-2)
- [ ] Add 2FA/MFA support

---

## Appendix: Files Reviewed

| File | Purpose |
|------|---------|
| `server/auth.ts` | Session setup, login, register, logout, password reset routes, OAuth routes |
| `server/auth/rate-limiter.ts` | Database-backed rate limiting middleware |
| `server/auth/account-security.ts` | Account lockout after failed login attempts |
| `server/auth/password-reset.ts` | Token-based password reset flow |
| `server/auth/oauth-google.ts` | Google OAuth 2.0 implementation |
| `server/index.ts` | Express app setup, Helmet, CORS, body parsing, error handler |
| `server/routes.ts` | All API endpoints (~2700 lines, 80+ endpoints) |
| `server/storage.ts` | Data access layer, password hashing utilities, ownership checks |
| `server/db.ts` | Database connection (Neon PostgreSQL + Drizzle ORM) |
| `server/spaces.ts` | DigitalOcean Spaces (S3) file storage |
| `shared/schema.ts` | Database schema definitions + Zod validation schemas |
| `client/src/hooks/use-auth.tsx` | Frontend auth context, localStorage token management |
| `client/src/lib/queryClient.ts` | API request handling, 401 interception |
| `package.json` | Dependency manifest |
| `.gitignore` | Git ignore rules (checked for .env inclusion) |
