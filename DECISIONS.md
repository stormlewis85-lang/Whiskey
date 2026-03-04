# DECISIONS.md - MyWhiskeyPedia

> Architectural and feature decision log. Records what was decided and why.
> Agents: check here before re-investigating previously resolved questions.

---

## Pre-Agent Decisions (Historical Context)

These decisions were made before the agent system was deployed. They are documented here so agents have context.

### D-000: Tech Stack Selection
- **Decision:** React 18 + TypeScript + Vite / Express.js / PostgreSQL + Drizzle ORM
- **Context:** Originally built on Replit with vanilla setup, migrated to Digital Ocean App Platform for production
- **Rationale:** Familiar stack with strong TypeScript support. Drizzle chosen for type-safe queries and migration tooling.

### D-001: Black and Gold Design System
- **Decision:** Near-black backgrounds (#0A0A0A) with sparse gold accents (#D4A44C)
- **Context:** Inspired by premium whiskey brands (Glenfiddich, The Macallan)
- **Rationale:** Gold used as a precious element only for stars, CTAs, active states. Restraint creates more impact than widespread use.

### D-002: Mobile-First Redesign
- **Decision:** Bottom tab navigation with ProfileMenu for secondary features
- **Context:** Transitioned from desktop-first layouts. Inspired by Drammer and Untappd.
- **Rationale:** Primary features in bottom nav, secondary features (Dashboard, Flights, Blind Tastings) accessible via ProfileMenu to keep navigation clean.

### D-003: Community Features MVP Approach
- **Decision:** Start with crowd-sourced store monitoring via @MyWhiskeyPedia Instagram account
- **Context:** Direct scraping violates platform TOS. Official APIs require store cooperation.
- **Rationale:** Monitor our own Instagram feed via Graph API (no TOS issues). Users submit store handles. Transition to direct store posting as stores onboard.

### D-004: Freemium Monetization Model
- **Decision:** Three tiers (Free / Collector / Connoisseur) with Stripe integration
- **Context:** Need sustainable revenue to support platform growth
- **Rationale:** Feature gating on store follows, wishlist size, club membership, notification priority. Free tier drives adoption, paid tiers unlock power features.

---

## Agent Decisions

_Decisions made during agent-driven development will be logged below._

### D-005: Phase 4 Social Layer — Palate Matching Algorithm
- **Decision:** Cosine similarity on scoring tendencies vector (nose, mouthfeel, taste, finish, value, overall) from existing `getPalateProfile()` + shared flavor tag analysis
- **Context:** Need to match users by taste preferences for the Social Layer
- **Rationale:** Leverages existing palate profile data structure (line 1252 storage.ts). Cosine similarity handles magnitude differences (generous vs critical scorers). Combined with shared flavor tags for human-readable matching explanation. No new tables needed — computed on demand.

### D-006: Phase 4 Social Layer — Activity Feed Architecture
- **Decision:** Dedicated `activities` table with event logging, not computed from source tables
- **Context:** Could either query source tables (follows, whiskeys, reviews) or log events to a dedicated table
- **Rationale:** Dedicated table is faster to query (single table scan), supports types that don't map to existing tables (trade events), and allows future features like read markers. Activity logging is fire-and-forget (`.catch(() => {})`) to avoid slowing down primary operations.

### D-007: Phase 4 Social Layer — Trade Listings Design
- **Decision:** Simple trade board model with status workflow (available → pending → completed/withdrawn)
- **Context:** Could build full negotiation/messaging system or keep it simple
- **Rationale:** MVP approach — list bottles for trade with "seeking" description, no in-app negotiation. Users contact through profiles. Keeps complexity low. Can add messaging/offers in future iteration.

### D-008: Phase 5 Palate Development — XP & Level System
- **Decision:** 10-level progression system (0–5500 XP) with named titles (Newcomer → Legend)
- **Context:** Needed gamification for palate training engagement
- **Rationale:** XP awarded for reviews (25 XP), challenge completion (50-300 XP by difficulty), exercise completion (30 XP), and streak milestones (50 XP at 7 days, 200 XP at 30 days). Levels stored in user_progress table per user. getLevelForXP() utility in shared/schema.ts for consistent level calculation across frontend and backend.

### D-009: Phase 5 Palate Development — AI Exercise Generation
- **Decision:** Extend rick-service.ts with generatePalateExercise() function using Claude API
- **Context:** Needed personalized palate training exercises based on user's profile gaps
- **Rationale:** Reuses existing Rick House Claude API integration pattern (same model, similar prompt structure). Analyzes user's palate profile (scoring tendencies, top flavors, preferred types) to generate targeted exercises. 4 exercise types: nose_training, blind_comparison, flavor_isolation, palate_calibration. Exercises stored in palate_exercises table. Rate-limited via existing aiRateLimiter.

### D-010: Phase 5 Palate Development — Challenge System Design
- **Decision:** Pre-seeded challenge catalog with 5 challenge types and user enrollment model
- **Context:** Could do dynamic challenge generation or fixed catalog
- **Rationale:** Fixed catalog with seedDefaultChallenges() for predictable content. 5 types: review_streak (consistency), flavor_hunt (identification), explore_type (diversity), blind_identify (skill), community_challenge (social). User joins challenges via user_challenges table tracking progress/status. Challenges can be recurring (re-enrollable after completion). Auto-completes and awards XP when progress >= goalCount.
