# CLAUDE.md — MyWhiskeyPedia Agent System Configuration

> This project uses a structured agent system. Read this file first on every session.

## Agent Framework

- **Framework:** `.agent-framework/` (git submodule — DO NOT MODIFY)
- **Framework repo:** github.com/stormlewis85-lang/agent-master-repo
- **Domain:** Software (see `.agent-framework/domains/software.md`)

## Context Files

1. Read `.agent-framework/CONTEXT_MASTER.md` for universal standards
2. Read `.agent-framework/domains/software.md` for domain behavior
3. Read `./CONTEXT_PROJECT.md` for project-specific details
4. Read `./PATTERNS.md` for codebase conventions (if it exists)
5. Read `./specs/` directory for detailed system documentation
6. Project context overrides framework where there's a conflict

## Project State

- **Tasks:** `./TASKS.md` - PM-owned task tracker, single source of truth
- **Decisions:** `./DECISIONS.md` - Architectural and feature decision log
- **Research:** `./RESEARCH.md` - Research findings and landscape analysis
- **Patterns:** `./PATTERNS.md` - Codebase conventions (owned by Architect, read by Developer and Test)
- **Autopilot:** `./autopilot-rules.md` - Unattended execution rules (optional, read by PM in Autopilot mode)

## Session Start Protocol

### Interactive Mode (Default)

1. Read this file (CLAUDE.md)
2. Read TASKS.md to understand current project state
3. Resume work where the last session left off
4. Check DECISIONS.md if the current task involves architectural choices
5. Check RESEARCH.md if the current task involves previously researched topics
6. Read relevant `specs/` files for the area being modified

### Autopilot Mode (Ralph Loop)

1. Read this file (CLAUDE.md)
2. Read autopilot-rules.md for execution boundaries
3. Read TASKS.md - identify next Autopilot-eligible task
4. PM validates the task against autopilot rules:
   - Within scope ceiling? (Quick/Standard only unless rules say otherwise)
   - Outside risk boundaries? (skip if it touches restricted areas)
   - Dependencies met? (prior tasks complete, gates passed)
5. If no eligible tasks remain, exit cleanly with status summary
6. If eligible task found, PM assigns agents and executes the pipeline
7. On completion, update TASKS.md, commit, exit - next iteration gets fresh context

## Pipeline

```
Storm > PM > Research > Architect > Developer > Test > QA > Docs
```

Not every task uses every step. PM determines the pipeline per task.

## Hierarchy

- **Tier 1:** PM Agent (orchestrator - all work flows through PM)
- **Tier 2:** Research, Architect, Developer, Test, QA, Docs (always available)
- **Tier 3:** Specialists activated for this project (see CONTEXT_PROJECT.md)
- **Meta:** Agent Creator (activated only when capability gaps are identified)

## Token Economy

- PM assigns scope tiers: **Quick** / **Standard** / **Deep** / **Autopilot**
- Agents match effort and verbosity to the assigned tier
- Minimum viable agent team per task - not every task needs the full pipeline
- Check DECISIONS.md and RESEARCH.md before regenerating prior analysis
- Be brief by default. Offer to elaborate when depth might help.

---

## Project-Specific Rules

### CRITICAL: Review Scoring System

The 6-component weighted scoring system is core IP. See `specs/REVIEW-SYSTEM.md` for full details. Do NOT modify the weighting algorithm without explicit instruction from Storm.

### CRITICAL: Auth Flow

JWT stored in httpOnly cookie. Google OAuth for authentication. Check `specs/API.md` for the full auth flow. Known issue: delete operations may have session token bugs.

### Before Making Changes

1. Read the relevant spec file in `specs/` for the area you are modifying
2. Run existing tests to establish baseline
3. Make atomic commits with descriptive messages

### Code Style

- TypeScript strict mode
- Async/await over promises
- Error handling on all API calls
- No console.log in production code (use proper logging)

### Database Changes

- ORM: Drizzle ORM (PostgreSQL)
- Never modify schema directly
- Create migration files for all changes
- Test migrations on a copy first

### Testing Requirements

- All API endpoints must have test coverage
- Frontend components need smoke tests
- Run full test suite before marking task complete

### Git Commit Format

```
type: brief description

- Detail 1
- Detail 2
```

Types: feat, fix, test, docs, refactor, chore

## Spec Files Reference

| File | Purpose |
|------|---------|
| `specs/ARCHITECTURE.md` | System design and folder structure |
| `specs/DATABASE.md` | Schema and relationships |
| `specs/API.md` | All endpoints with request/response |
| `specs/TESTING.md` | Test plan and verification |
| `specs/REVIEW-SYSTEM.md` | 6-component weighted scoring system |
| `specs/TASKS.md` | Legacy task tracking (superseded by root TASKS.md) |

## Golden Rules

1. Always discuss and plan before building. Never code unless Storm says to build. (Exception: Autopilot mode executes pre-approved tasks.)
2. Minimum viable team per task.
3. No redundant work - check existing docs first.
4. Own your lane - do not do another agent's job.
5. Flag blockers immediately.
6. Ship incrementally.
