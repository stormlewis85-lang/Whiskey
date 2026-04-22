# Spec Read

Load the right `specs/` file(s) for the current task: $ARGUMENTS

## Workflow

1. Read `CLAUDE.md` for the specs file map.
2. Based on the task description, decide which specs apply:
   - Auth / session / OAuth / JWT → `specs/API.md` (auth section)
   - Database schema / migrations / Drizzle → `specs/DATABASE.md`
   - API endpoint design → `specs/API.md`
   - System architecture / folder layout → `specs/ARCHITECTURE.md`
   - Test plan / verification → `specs/TESTING.md`
   - Review scoring system → `specs/REVIEW-SYSTEM.md` (and run `/scoring-check` before touching)
3. Read the relevant spec(s) in full.
4. Summarize the relevant sections for the current task — what the spec says, what constraints it imposes, and what's explicitly out of scope.
5. Flag any spec-to-code drift noticed while reading: if the spec describes a behavior that the code no longer matches, call it out — and decide whether to update the spec or the code.

## Output format

```
## SPEC READ — YYYY-MM-DD — Task: [summary]

### Specs loaded
- `specs/[file].md` — [section]

### Relevant rules
- [rule 1]
- [rule 2]

### Out of scope per spec
- [anything the spec explicitly excludes]

### Drift flagged (if any)
- [spec says X, code does Y] — proposed resolution
```

## Why this exists

Per Golden Rule 3: **no redundant work — check existing docs first.** The specs folder is the answer to "how should this work" for most non-trivial questions. Use this command to avoid re-deriving decisions that are already in writing.

## Tier

Quick. Run at the start of any task that touches auth, data, API, or scoring.
