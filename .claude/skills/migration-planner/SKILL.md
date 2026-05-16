---
name: migration-planner
description: |
  Use when planning major framework upgrades, database schema migrations, breaking
  API changes, or library swaps. Also when dependency-audit surfaces major version
  bumps. Do NOT use for minor version patches or non-breaking changes.
---

## Impact Assessment
- **Scope:** Files, modules, systems affected
- **Breaking changes:** Catalog from target's changelog
- **Dependency cascade:** Other deps affected
- **Data risk:** Touches persistent data (DB, files, configs)?
- **Consumer impact:** External consumers need changes?

## Risk Classification
| Level | Criteria | Approach |
|---|---|---|
| Low | No data changes, < 10 files | Single PR, standard review |
| Medium | Schema changes w/ rollback, 10-50 files | Phased PRs, feature flags |
| High | Breaking external API, irreversible data, 50+ files | Multi-sprint, parallel running |

## Strategy

### Incremental (preferred)
1. Create compatibility layer / adapter
2. Migrate consumers one-by-one behind feature flags
3. Remove compatibility layer after full migration
4. Delete old code

### Big Bang (when incremental infeasible)
1. Migration branch → complete all changes → full test suite → deploy with rollback ready

## Rollback Plan (required for every migration)
- **Database:** Down migration tested before running up
- **API:** Previous version available during transition
- **Framework:** Git revert path identified
- **Data:** Backup before irreversible transforms

## Execution Checklist
- [ ] Impact assessment in DECISIONS.md
- [ ] Breaking changes cataloged
- [ ] Rollback plan documented and tested
- [ ] Migration script tested against staging data
- [ ] Feature flags in place (if phased)
- [ ] Consumer notification sent (if external)
- [ ] Test suite passes at every phase boundary
- [ ] PATTERNS.md updated post-migration

## Anti-Patterns
- "Big bang" with no intermediate gate — break it up
- Writing rollback plan during the incident instead of before Phase 1
- Compatibility shims without sunset dates becoming permanent architecture
- Data migrations assuming old schema won't receive writes during cutover
