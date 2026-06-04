# Patterns — Codebase Conventions

> Owned by Architect Agent. Read by Developer and Test on every task. Defines how code is written in this project — naming, structure, signatures, and patterns. Follow these before inventing new approaches.

<!-- Last updated: 2026-06-03 by Architect Agent (v3.4 pipeline) -->

## Naming Conventions

- **TypeScript files:** camelCase for utilities/hooks (`useWhiskeyCollection.ts`), PascalCase for React components (`ActivityCard.tsx`), kebab-case for auth/utility pages (`auth-page.tsx`, `forgot-password.tsx`).
- **React components:** PascalCase named exports. Use function keyword, not arrow function, for page-level components — `client/src/pages/Home.tsx:28`.
- **Interfaces/types:** PascalCase. Props interfaces named `<Component>Props` — `client/src/components/activity/ActivityCard.tsx:20`.
- **DB columns:** snake_case in Drizzle column definitions; camelCase TypeScript field names (Drizzle maps automatically) — `shared/schema.ts:32` (`createdAt` / `"created_at"`).
- **Enums:** `pgEnum` values are snake_case strings — `shared/schema.ts:8` (`'sealed', 'open', 'finished', 'gifted'`). TypeScript enum constants use camelCase suffix: `bottleStatusEnum`.
- **Server helpers:** camelCase functions, verb-first naming — `getUserId`, `parsePaginationParams` (`server/routes.ts:66,77`).
- **No `console.log` in production** — use `logger` from `server/lib/logger.ts` (Key Constraint #5).

## Database Patterns

- **ORM:** Drizzle ORM with `drizzle-orm/pg-core`. All tables defined in `shared/schema.ts`.
- **Primary key:** `serial("id").primaryKey()` on every table — `shared/schema.ts:21`.
- **Timestamps:** All tables carry `createdAt: timestamp("created_at").defaultNow()`. Mutable tables add `updatedAt: timestamp("updated_at").defaultNow()` — `shared/schema.ts:31-32`.
- **Foreign keys:** `entityId` camelCase convention; always include `onDelete` action — `shared/schema.ts:70` (`userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' })`).
- **Unique constraints:** Declared inline in the table callback, not as column modifiers — `shared/schema.ts:59-64`.
- **Zod validation:** Every insert shape gets a `createInsertSchema` companion and is exported — `shared/schema.ts:3-4`.
- **MIGRATIONS ONLY** — never modify the schema directly in the DB. Use `npm run db:push` only in development; production changes require a migration file. This is a hard constraint — `CONTEXT_PROJECT.md:§Key Constraints #4`.
- **Review scoring system** is CORE IP. Do not touch its schema columns without Storm approval. See `specs/REVIEW-SYSTEM.md` for implementation details.

## API Patterns

- **Route prefix:** All API routes are under `/api/`. No exceptions.
- **Auth middleware:** `isAuthenticated` from `server/auth.ts` is applied per-route, not globally — `server/routes.ts:52`.
- **UserId extraction:** Always use the `getUserId(req)` helper — never read `req.session.userId` directly in route handlers. It throws a typed 401 error if unauthenticated — `server/routes.ts:66-74`.
- **Pagination:** Use `parsePaginationParams(req)` helper. Limit is capped at 100, minimum 1 — `server/routes.ts:77-81`.
- **Rate limiting:** AI endpoints (`/api/rick-house`, enrichment) must use `aiRateLimiter` middleware (20 req/hr per IP) — `server/routes.ts:57-63`.
- **Request validation:** Validate request bodies with the corresponding Zod insert/update schema exported from `shared/schema.ts`. On `ZodError`, convert with `fromZodError` for readable messages — `server/routes.ts:48-49`.
- **Response format:** Success → JSON object or array. Error → `{ message: string }` only; never expose stack traces or DB errors to the client.

## Error Handling

- **Server errors:** Use `safeError(error, fallbackMessage)` from `server/lib/errors.ts`. It logs the real error server-side via `logger` and returns a sanitized `{ message }` for the response — `server/lib/errors.ts:7-10`.
- **HTTP status extraction:** Use `errorStatus(error)` when an upstream helper throws with a `.status` property (e.g., `getUserId` throws 401) — `server/lib/errors.ts:17-22`.
- **User objects:** Strip sensitive fields before any response using the `sanitizeUser` pattern from `server/auth.ts:23-26`. Fields to omit: `password`, `authToken`, `tokenExpiry`, `failedLoginAttempts`, `accountLockedUntil`.
- **Client errors:** Wrap page-level trees in `<ErrorBoundary>` — `client/src/components/ErrorBoundary.tsx`. Use `useToast` + `<Toaster>` for user-facing feedback, never `alert()`.

## Component Patterns

- **Routing:** `wouter` (not React Router) for client-side routing — `client/src/App.tsx:2`. Protected pages use `<ProtectedRoute>` wrapper.
- **All pages are lazy-loaded** via `React.lazy()` + `<Suspense fallback={<PageLoader />}>` for code splitting — `client/src/App.tsx:15-42`.
- **Server state:** TanStack Query v5 (`@tanstack/react-query`) for all API data fetching. No raw `fetch` calls outside of query functions.
- **Forms:** `react-hook-form` + `@hookform/resolvers` + Zod schemas for validation.
- **Base components:** shadcn/ui (Radix primitives + Tailwind) lives in `client/src/components/ui/`. Do not modify these files directly — extend via wrapper components.
- **Black & Gold design system:** Use CSS variables (`hsl(var(--muted))`, `hsl(var(--muted-foreground))`) for tonal values, not hardcoded hex — `client/src/components/activity/ActivityCard.tsx:41`. Gold (`#D4A44C`) is reserved for stars, CTAs, and active states only — never decorative.
- **Inline styles for precise Black & Gold tokens** are acceptable where Tailwind classes would require custom config — see `ActivityCard.tsx:29-57` for the pattern (borders via `rgba(255,255,255,0.04)`, font sizes via `rem` literals).
- **Skeleton states:** Every data-loading surface needs a skeleton component — e.g., `SkeletonCard`, `ActivityCardSkeleton`, `ProfileStatsSkeleton`.
- **Component subdirectories:** Feature-scoped components live in subdirectories — `components/activity/`, `components/bottle/`, `components/drops/`, `components/clubs/`, `components/modals/`.
- **Mobile-first always.** Use `useIsMobile()` hook to branch layout; bottom tab navigation is the primary nav surface — `client/src/pages/Home.tsx:30`.

## Test Patterns

- **Runner:** Vitest (`npm test` = `vitest run`, `npm run test:watch` = `vitest`) — `package.json:8-9`.
- **Test location:** Tests live in the `tests/` directory at project root. Six test files exist as of 2026-06-03: auth, whiskey-crud, distillery, whiskey-delete, review-edit, review-crud. Coverage gaps remain — see `specs/TESTING.md` for the full test plan. <!-- QA correction 2026-06-03: Architect's initial read missed the tests/ directory -->

- **File naming:** Mirror the source path — `server/storage.ts` → `tests/server/storage.test.ts`.
- **HTTP integration tests:** Use `supertest` (declared in devDependencies, `package.json:116`) against the Express app instance.
- **Do not test review scoring internals** — see `specs/REVIEW-SYSTEM.md`. Test the API surface (request/response shapes and status codes) only.

## File Organization

```
shared/
  schema.ts          — Single source of truth for all DB table definitions + Zod schemas
server/
  index.ts           — App entry point
  routes.ts          — All Express route registrations
  auth.ts            — Session setup, isAuthenticated middleware, sanitizeUser
  storage.ts         — DB query layer (called by routes)
  db.ts              — Drizzle client + pg pool
  spaces.ts          — Digital Ocean Spaces CDN helpers
  lib/
    errors.ts        — safeError / errorStatus utilities
    logger.ts        — Structured logger (use instead of console.log)
    crypto.ts        — Crypto utilities
  auth/              — Auth sub-modules (rate-limiter, oauth-google, etc.)
  email/             — Email templates and sender
client/src/
  App.tsx            — Router, providers, lazy-loaded page registrations
  pages/             — One file per route; PascalCase
  components/
    ui/              — shadcn/ui base components (do not modify)
    <feature>/       — Feature-scoped component subdirectories
    modals/          — Modal components
  hooks/             — Custom React hooks
  lib/               — Client-side utilities and query client
tests/               — Project test files (Vitest) — 6 files as of 2026-06-03
specs/               — Architecture/API/DB/testing specs (canonical reference)
```

## Common Gotchas

- **`db:push` is not a migration tool for production.** It is development-only. Schema drift between environments has caused issues in the Replit-era codebase. Always write a migration file for prod changes.
- **Session vs. token auth fallback.** `isAuthenticated` tries session first, then `Bearer` token. Any route that deletes session data (`req.session.destroy`) before responding may cause silent 401s on subsequent requests — this is the suspected cause of the delete operation auth bug (`CONTEXT_PROJECT.md:§Known Issues`).
- **`console.log` calls remain in `server/routes.ts`** (lines 85, 87, 95-96) from Replit-era code — these should be migrated to `logger` before production hardening.
- **Image uploads have two paths:** disk storage (bottle images, processed via sharp to WebP at 1600px max) and memory storage (store images, Excel imports). Do not mix them.
- **Gold overuse is a design bug.** If a new component reaches for `#D4A44C` for anything other than stars, active states, or primary CTAs, treat it as a defect requiring UI/UX review.
