# CONTEXT_PROJECT.md — MyWhiskeyPedia

> Project-specific context for the agent team. Read after `.agent-framework/CONTEXT_MASTER.md` and `.agent-framework/domains/software.md`.
>
> **Domain:** Software | **Framework:** `.agent-framework/` (git submodule)

## Domain
software

## What This Is

MyWhiskeyPedia is a premium whiskey collection and review platform that combines personal collection management with AI-powered tasting guidance and community features. It serves whiskey enthusiasts who want to track collections, get intelligent tasting recommendations, and connect with other collectors around rare bottle releases and store drops.

**Live at:** mywhiskeypedia.com
**Repo:** github.com/stormlewis85-lang/Whiskey

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express.js |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Google OAuth → JWT (httpOnly cookies) |
| AI | Anthropic Claude API (bottle data enrichment, tasting notes) |
| Hosting | Digital Ocean App Platform |
| Images | Digital Ocean Spaces (CDN) |
| Domain | mywhiskeypedia.com |

## Design System

- **Status:** Active — see `/DESIGN.md` (v2.0) for the full specification
- **Aesthetic:** "Black & Gold" — inspired by Glenfiddich, The Macallan
- **Primary background:** #0A0A0A (near-black)
- **Gold accent:** #D4A44C — used sparingly as a "precious" element (stars, CTAs, active states only)
- **Typography:** Playfair Display (branding), DM Serif Display (headings), DM Sans (body)
- **Principles:** Dramatic typography scales, generous whitespace, tonal depth over shadows, gold restraint

## Current State

**Status:** Beta-ready. Core platform features complete. Preparing for friend/group testing.

### What's Built

- **Collections:** Full bottle management with status tracking, images, metadata
- **Reviews:** 6-component weighted scoring system (CORE IP — do not modify without Storm's approval)
- **Rick House:** AI-powered tasting guide using Claude API
- **Bottle Enrichment:** Claude API integration for auto-populating bottle data
- **Auth:** Google OAuth with JWT session management
- **Mobile-First UI:** Bottom tab navigation, activity feeds, profile layouts (inspired by Drammer/Untappd)
- **ProfileMenu:** Component providing access to Dashboard charts, Flights, Blind Tastings
- **Security:** Completed audit addressing env variable exposure, error message leaks, dependency vulnerabilities
- **Performance:** Lazy loading, skeleton states, optimized image delivery via CDN

### Known Issues

- Delete operations may have session token bugs (auth flow edge case)
- Original Replit-era code may have patterns that need modernization

### What's NOT Built Yet

- Freemium monetization (Stripe integration, feature gating)
- Push notification infrastructure
- Code splitting optimization
- N+1 query refactoring

## Architecture Notes

### Frontend Structure

- Mobile-first with bottom tab navigation
- React Router for page routing
- Component library following Black & Gold design system
- ProfileMenu component for secondary feature access (keeps bottom nav clean)

### Backend Structure

- Express.js REST API
- Drizzle ORM for type-safe database queries
- Migration-based schema management (never modify schema directly)
- Error handling middleware with sanitized error responses (post-security audit)

### Database

- PostgreSQL hosted on Digital Ocean
- Drizzle ORM with TypeScript type generation
- See `specs/DATABASE.md` for full schema
- Schema will expand significantly for community features (Store, Club, Follow, Session entities)

## Community Features Roadmap

See `MyWhiskeyPedia_Community_Features_Spec.md` for the full specification.

### Phase 1: The Hunt (Weeks 1-4) — MVP Priority
Store following system, drop alerts, wishlist integration, keyword detection on store posts, push notification infrastructure. MVP approach uses a @MyWhiskeyPedia Instagram account to monitor store feeds via Graph API.

### Phase 2: Store Profiles (Weeks 5-8)
Store profile pages, claiming flow, QR code generation, analytics dashboard, verified badges.

### Phase 3: Tasting Clubs (Weeks 9-14)
Club creation/management, tasting session scheduling, blind tasting mode, shared history, virtual tasting integration.

### Phase 4: Social Layer (Weeks 15-18)
User following, activity feed, palate matching algorithm, collection sharing/comparison, trade flagging.

### Phase 5: Palate Development (Weeks 19-22)
Challenge system, progress tracking, Rick House integration for exercises, social accountability.

### Monetization
Freemium model: Free / Collector / Connoisseur tiers. Stripe integration planned for feature gating.

## Active Tier 3 Specialists

The following specialists are activated for this project:

- **UI/UX Agent** — Mobile-first design, Black & Gold system enforcement, component design
- **API Agent** — Instagram Graph API integration, Claude API, future Stripe integration
- **Data Agent** — PostgreSQL/Drizzle schema design, query optimization, community feature data modeling
- **DevOps Agent** — Digital Ocean App Platform, Spaces CDN, deployment pipeline
- **Security Agent** — Auth flow, API security, environment variable management, dependency auditing

## Key Constraints

1. **Review scoring system is untouchable** without explicit approval from Storm
2. **Gold accent is precious** — never overuse it. Stars, CTAs, active states only.
3. **Mobile-first always** — desktop is secondary
4. **Database changes require migrations** — never modify schema directly
5. **No console.log in production** — use proper logging
6. **Discuss before building** — no code until Storm approves the approach

## Spec Files

Detailed documentation lives in `specs/`:

- `ARCHITECTURE.md` — System design and folder structure
- `DATABASE.md` — Schema and relationships
- `API.md` — All endpoints with request/response
- `TESTING.md` — Test plan and verification
- `REVIEW-SYSTEM.md` — 6-component weighted scoring system

These are current and accurate as of the last session. Agents should reference them for implementation details.
