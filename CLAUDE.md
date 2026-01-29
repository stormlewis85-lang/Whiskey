# WhiskeyPedia - Claude Code Instructions

## Project Overview
WhiskeyPedia is a full-stack whiskey collection management platform. Users can catalog their whiskey collection, write detailed reviews using a weighted scoring system, track bottle status, and get AI-generated tasting notes.

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Auth:** JWT tokens (httpOnly cookies)
- **AI:** Anthropic Claude API (tasting notes)
- **Hosting:** Replit

## Critical Files
- `specs/ARCHITECTURE.md` - System design and folder structure
- `specs/DATABASE.md` - Schema and relationships
- `specs/API.md` - All endpoints with request/response
- `specs/TESTING.md` - Test plan and verification
- `specs/TASKS.md` - Current work items

## Working Rules

### Before Making Changes
1. Read the relevant spec file for the area you're modifying
2. Run existing tests to establish baseline
3. Make atomic commits with descriptive messages

### Code Style
- TypeScript strict mode
- Async/await over promises
- Error handling on all API calls
- No console.log in production code (use proper logging)

### Database Changes
- Never modify schema directly
- Create migration files for all changes
- Test migrations on a copy first

### Testing Requirements
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

## Important Context

### Review System (Complex)
The 6-component weighted scoring system is the core IP. See `specs/REVIEW-SYSTEM.md` for full details. Do NOT modify the weighting algorithm without explicit instruction.

### Auth Flow
JWT stored in httpOnly cookie. Check `specs/API.md` for the full auth flow. Known issue: delete operations may have session token bugs.

### Current State
App is ~95% complete. Focus is on:
1. Testing all functionality
2. Fixing any broken features
3. Polishing for distribution

Do NOT add new features unless explicitly instructed.
