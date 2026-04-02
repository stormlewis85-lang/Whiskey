# CLAUDE.md — MyWhiskeyPedia Configuration

> This file is read automatically at the start of every Claude Code session.

## Agent System

**Read `./agents-master/CLAUDE.md` for the full agent workflow, pipeline, hierarchy, and session protocol. Follow it.**

This file is the project-level config. The submodule file defines how the agent team works.

## Project Overview

MyWhiskeyPedia is a whiskey review and discovery platform with a 6-component weighted scoring system.

## Tech Stack

- TypeScript (strict mode)
- Drizzle ORM + PostgreSQL
- JWT auth (httpOnly cookie) + Google OAuth
- Async/await over promises

## Project-Specific Rules

### CRITICAL: Review Scoring System

The 6-component weighted scoring system is core IP. See `specs/REVIEW-SYSTEM.md` for full details. Do NOT modify the weighting algorithm without explicit instruction from Storm.

### CRITICAL: Auth Flow

JWT stored in httpOnly cookie. Google OAuth for authentication. Check `specs/API.md` for the full auth flow. Known issue: delete operations may have session token bugs.

## Context Files

1. Read `./CONTEXT_PROJECT.md` for project-specific details
2. Read `./TASKS.md` for current task state and backlog
3. Read `./DECISIONS.md` for architectural decisions with rationale
4. Read relevant `specs/` files for the area being modified

## Key Files

| File | Purpose |
|------|---------|
| `specs/ARCHITECTURE.md` | System design and folder structure |
| `specs/DATABASE.md` | Schema and relationships |
| `specs/API.md` | All endpoints with request/response |
| `specs/TESTING.md` | Test plan and verification |
| `specs/REVIEW-SYSTEM.md` | 6-component weighted scoring system |

## Code Style

- TypeScript strict mode
- Async/await over promises
- Error handling on all API calls
- No console.log in production code (use proper logging)

## Database Changes

- ORM: Drizzle ORM (PostgreSQL)
- Never modify schema directly
- Create migration files for all changes
- Test migrations on a copy first

## Testing Requirements

- All API endpoints must have test coverage
- Frontend components need smoke tests
- Run full test suite before marking task complete

## Git Commit Format

```
type: brief description

- Detail 1
- Detail 2
```

Types: feat, fix, test, docs, refactor, chore

## Golden Rules

1. Always discuss and plan before building. Never code unless Storm says to build. (Exception: Autopilot mode executes pre-approved tasks.)
2. Minimum viable team per task.
3. No redundant work - check existing docs first.
4. Own your lane - do not do another agent's job.
5. Flag blockers immediately.
6. Ship incrementally.
