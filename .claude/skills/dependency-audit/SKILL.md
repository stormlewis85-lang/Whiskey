---
name: dependency-audit
description: |
  Use when auditing dependencies, checking CVEs, assessing package health, reviewing
  licenses, or evaluating upgrade priority. Also before adding a new dependency or
  when a security advisory lands. Do NOT use for general code review or architecture.
---

## Procedure

### 1. Inventory
- List all direct + transitive deps with versions
- Check lock file freshness, flag phantom deps (no lock entry)

### 2. Vulnerability Scan
```bash
npm audit                        # Check known CVEs
npm audit --audit-level=high     # CI gate
npm audit fix --dry-run          # Preview fixes
```
Cross-reference NIST NVD and GitHub Advisory Database.

### 3. Severity Response Times
| Severity | Response | Action |
|---|---|---|
| Critical | 24h | Patch immediately, hotfix deploy |
| High | 48h / sprint | Patch, next deployment |
| Moderate | 1 week | Schedule fix, assess exposure |
| Low | Next maintenance | Log, patch opportunistically |

### 4. Maintenance Health (1-5 scale)
| Signal | Healthy (5) | Concerning (3) | Dead (1) |
|---|---|---|---|
| Last publish | < 3mo | 3-12mo | > 12mo |
| Open issues | Triaged | Growing backlog | Ignored |
| Contributors | Active team | Single maintainer | Abandoned |
| License | MIT, Apache 2.0 | LGPL, MPL | GPL, AGPL, unlicensed |

### 5. Before Adding a New Dependency
- [ ] Necessary? Can we write it in < 100 lines?
- [ ] Weekly downloads > 100K?
- [ ] Last publish < 1 year?
- [ ] License compatible? (MIT/Apache = fine, GPL = check)
- [ ] Bundle size acceptable? (bundlephobia.com)
- [ ] Transitive dep count reasonable?

### 6. Hygiene Rules
- Minimize tree — prefer native solutions
- Pin major versions, `^` for minor/patch
- Lock file committed, diffs reviewed
- No `*` versions
- Separate devDependencies from dependencies

## CVE Response
1. ASSESS: Production or dev-only?
2. VERIFY: Does CVE apply to your usage? (reachability)
3. PATCH: Update, workaround, or replace
4. DEPLOY: Push fix to production
5. LOG: Record in DECISIONS.md

## Anti-Patterns
- `npm audit fix --force` without review — can yank major versions
- Treating low-severity CVEs as zero priority forever
- Adding deps for one-off utilities writable in < 100 lines
- Zero CVEs ≠ safe if maintainer abandoned the package
