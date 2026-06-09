# CONTEXT_PROJECT.md — MyWhiskeyPedia

> Project-specific context for the agent team. Read after the framework's CONTEXT_MASTER.md and domains/software.md (in the agents-master/ submodule).
>
> **Domain:** Software | **Framework:** `agents-master/` (git submodule)
> **Last reconciled against codebase:** 2026-06-07

## Domain
software

## Project Capabilities

<!-- Canonical declaration. PM checks this against each agent's Project Requirements at activation. -->

### Framework
- agents-master version: v3.4 (submodule @ 9c69fb4 on main)
- Last reconciled: 2026-06-07

### Infrastructure
- Language runtimes: Node.js (TypeScript via Vite/tsx)
- Package manager: npm
- Unit/integration testing: Vitest (vitest.config.ts; tests/ directory)
- E2E testing: none declared
- Database: PostgreSQL (Neon serverless) + Drizzle ORM (push-based via `drizzle-kit push`)
- CI/CD: none declared
- Hosting: Digital Ocean App Platform (UNVERIFIED from repo — no DO config files present; `.replit` autoscale config exists from Replit origin)
- Chrome available: yes (interactive sessions)
- Secrets management: .env / hosting provider env vars

### Active Agents
- Tier 2 (Core): PM, Research, Architect, Developer, Test, QA, Docs
- Tier 3 (Specialists): UI/UX, API, Data, DevOps, Security (see Active Tier 3 Specialists below)
- Meta: /agent-create command — no standing Agent Creator agent

### Active Domain
software

### File Structure
- specs/ directory holds detailed architecture/database/API/testing docs (non-standard — may be stale, verify against code before relying on them)
- DESIGN.md v2.0 active (Black & Gold system)
- PATTERNS.md populated 2026-06-03 (FW-V34-001, QA-verified)
- domains/ + skills/ (universal + software) seeded at project root 2026-06-03 per standard layout (DEC-007)
- Root CONTEXT_MASTER.md is a stale duplicate; canonical copy lives in the framework submodule

### Integrated Services
- Anthropic Claude API — Rick House tasting guide, bottle enrichment, image identification, AI tasting notes (`server/rick-service.ts`, `server/image-identify-service.ts`, `server/upc-lookup-service.ts`)
- ElevenLabs — Rick House text-to-speech voice (direct REST API, no SDK; `server/elevenlabs-service.ts`)
- Google OAuth — social login (`server/auth/oauth-google.ts`)
- Resend — transactional email for password reset (`server/email/sender.ts`)
- Digital Ocean Spaces — image/file storage via S3-compatible API (`server/spaces.ts`, `@aws-sdk/client-s3`)
- html5-qrcode — barcode scanning (`client/src/components/BarcodeScanner.tsx`)
- Instagram Graph API — **planned only**; `instagramHandle` field exists in stores schema but no API integration built
- Stripe — **planned only**; not present in codebase or package.json

## What This Is

MyWhiskeyPedia is a premium whiskey collection and review platform that combines personal collection management with AI-powered tasting guidance and community features. It serves whiskey enthusiasts who want to track collections, get intelligent tasting recommendations, and connect with other collectors around rare bottle releases and store drops.

**Live at:** mywhiskeypedia.com
**Repo:** github.com/stormlewis85-lang/Whiskey

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Router | wouter (SPA client-side routing) |
| Backend | Node.js + Express.js |
| Database | PostgreSQL (Neon serverless) + Drizzle ORM |
| Auth | Dual-mode: local (Passport/bcrypt/express-session) + Google OAuth; session store on PostgreSQL via connect-pg-simple; Bearer token fallback |
| AI | Anthropic Claude API (tasting guide, enrichment, image ID) + ElevenLabs (voice) |
| Email | Resend (password reset) |
| Hosting | Digital Ocean App Platform |
| Images | Digital Ocean Spaces (S3-compatible CDN) |
| Domain | mywhiskeypedia.com |

## Design System

- **Status:** Active — see `/DESIGN.md` (v2.0) for the full specification
- **Aesthetic:** "Black & Gold" — inspired by Glenfiddich, The Macallan
- **Primary background:** #0A0A0A (near-black)
- **Gold accent:** #D4A44C — used sparingly as a "precious" element (stars, CTAs, active states only)
- **Typography:** Playfair Display (branding), DM Serif Display (headings), DM Sans (body)
- **Principles:** Dramatic typography scales, generous whitespace, tonal depth over shadows, gold restraint

## Current State

**Status:** Beta-ready. Core platform and all 5 community feature phases shipped. Preparing for friend/group beta testing.

### Surface Area (verified 2026-06-07)

| Metric | Count |
|--------|-------|
| Frontend routes | 29 (20 protected, 9 public + catch-all) |
| Page files | 28 |
| Component files | ~136 |
| Database tables | 35 (see `shared/schema.ts`) |
| API route handlers | 136 (single `server/routes.ts` — 4,143 lines) |
| Storage layer | `server/storage.ts` — 3,824 lines |
| Server files | 20 root + 11 in subdirectories |

### What's Built

**Core Platform:**
- **Collections:** Full bottle management with status tracking, images, metadata
- **Reviews:** 6-component weighted scoring system (CORE IP — do not modify without Storm's approval)
- **Rick House:** AI-powered tasting guide using Claude API + ElevenLabs voice (3-zone layout: Atmosphere, Shelf, Journal)
- **Bottle Enrichment:** Claude API integration for auto-populating bottle data
- **Image Identification:** Claude API vision for bottle photo recognition
- **Auth:** Dual-mode — local (username/password with bcrypt, rate limiting, account lockout) + Google OAuth; beta gate (invite code `Rick2026`)
- **Email:** Password reset flow via Resend
- **Mobile-First UI:** Bottom tab navigation (Home | Search | [RICK] | Drops | Profile), activity feeds, profile layouts
- **Dashboard:** Stats and activity overview with Recharts
- **Analytics:** Charts and collection statistics page
- **Export:** Excel (exceljs) + PDF (jspdf/html2canvas) + share-as-image
- **Photo Capture:** In-app camera component for bottle photos
- **Barcode Scanner:** UPC lookup via html5-qrcode + server-side lookup service
- **Search & Community:** User search, discovery, global activity feed

**Community Features (Phases 1–5 — all shipped):**
- **Store Drops & Following (Phase 1):** Store profiles, drop alerts, store claiming, store analytics, followed stores list
- **Store Profiles (Phase 2):** Store pages with cover/logo images, claiming flow, analytics dashboard
- **Tasting Clubs (Phase 3):** Club creation/management, tasting sessions, session ratings, member invitations, blind session mode
- **Blind Tastings:** Full blind tasting flow with reveal and completion
- **Flights:** Tasting flight creation, whiskey ordering, reorder
- **Social Layer (Phase 4):** User following, activity feed (dedicated `activities` table), palate matching (cosine similarity), collection comparison, trade listings board
- **Palate Development (Phase 5):** Challenge system (5 types, 10 default challenges), XP/level progression (10 levels: Newcomer → Legend), AI-generated palate exercises via Claude, streak tracking with milestone bonuses, leaderboard
- **Price Tracking:** price_tracks and market_values tables
- **Social Sharing:** Share reviews as images, public share links (`/shared/:shareId`)

**Infrastructure:**
- **Security:** Completed audit (AUDIT-001 through 008) — env variable exposure, error message leaks, dependency vulns, session fixation, token handling all addressed
- **Performance:** Lazy loading, skeleton states, CDN image delivery, pagination caps on all list endpoints
- **ProfileMenu:** Access to Dashboard, Flights, Blind Tastings, Rick House, Settings

### Known Issues

- 4 TypeScript errors (`tsc --noEmit`): null-safety in `rick-suggestions.ts:130,134`; Drizzle date type in `password-reset.ts:152`; nullable string in `storage.ts:197`
- ~150 `console.log` calls in server/ (17 files; worst: routes.ts 40, upc-lookup-service.ts 26, reset-database.ts 24)
- ~20 `any` type annotations in server/ (6 files; worst: storage.ts 7, routes.ts 4)
- 1.8 MB Home chunk (no code splitting) — well above Vite's 500 KB warning
- 2 N+1 query patterns identified (AUDIT-007)
- Replit-era tooling still present: `.replit` config, dev dependencies `@replit/vite-plugin-cartographer` and `@replit/vite-plugin-runtime-error-modal`
- Dead dependencies in package.json: `@zxing/browser` + `@zxing/library` (barcode uses `html5-qrcode` instead), `memorystore` (sessions use `connect-pg-simple`)

### What's NOT Built Yet

- Freemium monetization (Stripe integration, feature gating per D-004 tiers)
- Push notification delivery infrastructure (notifications table exists; no push service)
- Instagram Graph API integration (field exists in stores schema; no API calls)
- In-app trade negotiation/messaging (trade board exists; contact is out-of-band)
- Code splitting optimization (React.lazy)
- N+1 query refactor with JOINs
- Top-level ErrorBoundary in App.tsx
- RadarChart integration into review display (component exists, currently orphaned)

## Architecture Notes

### Frontend Structure

- Mobile-first with bottom tab navigation (Home | Search | [RICK] | Drops | Profile)
- wouter for client-side SPA routing
- Component library following Black & Gold design system
- ProfileMenu component for secondary feature access (keeps bottom nav clean)
- TanStack Query v5 for server state management
- Framer Motion for animations

### Backend Structure

- Express.js REST API (single `server/routes.ts` — 136 handlers)
- Drizzle ORM for type-safe database queries (`server/storage.ts` — data access layer)
- Push-based schema management via `drizzle-kit push` (edit `shared/schema.ts`, then run `npm run db:push`)
- Error handling middleware with sanitized error responses (post-security audit)
- Standalone service modules: rick-service, elevenlabs-service, upc-lookup-service, image-identify-service, spaces, email/sender

### Database

- PostgreSQL on Neon serverless (`@neondatabase/serverless`)
- 35 tables defined in `shared/schema.ts`
- Session store: PostgreSQL via connect-pg-simple (table: `session`)
- Schema managed via `drizzle-kit push` — edit `shared/schema.ts` then push

## Community Features Status

> Originally planned as a 5-phase roadmap. All 5 phases are now shipped. Remaining work is enhancement, not greenfield.

| Phase | Name | Status | What Remains |
|-------|------|--------|-------------|
| 1 | The Hunt (Store Drops) | **Shipped** | Instagram Graph API integration; push notification delivery |
| 2 | Store Profiles | **Shipped** | — |
| 3 | Tasting Clubs | **Shipped** | — |
| 4 | Social Layer | **Shipped** | In-app trade messaging (backlog) |
| 5 | Palate Development | **Shipped** | — |
| — | Monetization | **Not started** | Stripe integration, feature gating (D-004) |

## Active Tier 3 Specialists

The following specialists are activated for this project:

- **UI/UX Agent** — Mobile-first design, Black & Gold system enforcement, component design
- **API Agent** — Claude API, ElevenLabs API, future Stripe/Instagram integration
- **Data Agent** — PostgreSQL/Drizzle schema design, query optimization
- **DevOps Agent** — Hosting, Spaces CDN, deployment pipeline
- **Security Agent** — Auth flow, API security, environment variable management, dependency auditing

## Key Constraints

1. **Review scoring system is untouchable** without explicit approval from Storm
2. **Gold accent is precious** — never overuse it. Stars, CTAs, active states only.
3. **Mobile-first always** — desktop is secondary
4. **Schema changes go through `shared/schema.ts` + `drizzle-kit push`** — never modify the database directly
5. **No console.log in production** — use `server/lib/logger.ts`
6. **Discuss before building** — no code until Storm approves the approach

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection |
| `SESSION_SECRET` | Yes | Cookie signing |
| `ANTHROPIC_API_KEY` | Optional | Claude API (Rick House, enrichment, image ID) |
| `ELEVENLABS_API_KEY` | Optional | Rick House voice |
| `ELEVENLABS_VOICE_ID` | Optional | Rick House voice ID |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth |
| `GOOGLE_CALLBACK_URL` | Optional | Google OAuth redirect |
| `OAUTH_ENCRYPTION_KEY` | Optional | Encrypt OAuth tokens (32-byte hex) |
| `RESEND_API_KEY` | Optional | Transactional email |
| `EMAIL_FROM` | Optional | Sender address |
| `SPACES_ACCESS_KEY` | Optional | Digital Ocean Spaces |
| `SPACES_SECRET_KEY` | Optional | Digital Ocean Spaces |
| `SPACES_REGION` | Optional | Defaults to sfo3 |
| `SPACES_BUCKET` | Optional | Defaults to whiskeypedia-uploads |
| `SPACES_CDN_ENDPOINT` | Optional | CDN URL for uploads |

## Spec Files

Detailed documentation lives in `specs/`:

- `ARCHITECTURE.md` — System design and folder structure
- `DATABASE.md` — Schema and relationships
- `API.md` — All endpoints with request/response
- `TESTING.md` — Test plan and verification
- `REVIEW-SYSTEM.md` — 6-component weighted scoring system

> **Staleness warning:** These specs were last verified before the community features (Phases 1–5) were built. They may not reflect the current 35-table schema or 136 API endpoints. Always verify against `shared/schema.ts` and `server/routes.ts` for current state.
