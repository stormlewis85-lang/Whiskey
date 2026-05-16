---
name: git-workflow
description: |
  ALWAYS use when committing code, creating branches, or managing PRs. Covers
  branching strategy, conventional commits, and merge process. Do NOT use for
  code review content (see code-review-checklist).
---

## Branching
- Never commit directly to main — all work on feature branches
- Naming: `<type>/<short-description>` (e.g., `feat/user-auth`, `fix/login-redirect`)
- Keep branches short-lived — merge within days, not weeks
- Pull from main before starting new work

## Committing
- Conventional commit format, imperative mood ("add" not "added")
- One logical change per commit
- Subject line < 70 characters
- Body for non-obvious changes explaining "why"

## Conventional Commit Types
| Prefix | Use |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Restructuring, no behavior change |
| `docs:` | Documentation only |
| `test:` | Adding/updating tests |
| `chore:` | Build, tooling, deps |
| `perf:` | Performance improvement |
| `style:` | Formatting only |

## Pull Requests
- Title: conventional commit format
- Description: summary (what + why), test plan, related issues
- All PRs require review before merge
- Address feedback with new commits — don't force-push over comments
- Squash merge to main for clean history

## Anti-Patterns
- Messages like "fix stuff" or "WIP" on main
- Long-lived feature branches drifting from main
- Force-pushing to shared branches
- Committing secrets, .env files, or large binaries
- Skipping review for "small changes"
