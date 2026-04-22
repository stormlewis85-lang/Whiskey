# Scoring Check

Verify that proposed or recent changes do not modify the 6-component weighted scoring system.

## Context

The 6-component weighted scoring system is core IP. Per the CLAUDE.md Golden Rule: **do NOT modify the weighting algorithm without explicit instruction from Storm.** The authoritative spec lives at `specs/REVIEW-SYSTEM.md`.

## Workflow

1. Read `specs/REVIEW-SYSTEM.md` — the current algorithm spec.
2. Identify the files that implement scoring:
   - Any function named `calculate*Score`, `weightedScore`, `compositeRating`, etc.
   - Database columns that store component or composite scores
   - Frontend components that render scores
3. For the diff or files passed as $ARGUMENTS (or the current working-tree diff if no args):
   - Grep for changes touching any scoring file
   - For each change, classify: **No-op** (refactor, rename, type change only) / **Behavior change** (weight, formula, rounding, component add/remove)
4. **Any behavior change is a P0 block** — even if tests pass. Flag it to Storm before merging.

## Output format

```
## SCORING CHECK — YYYY-MM-DD

### Files touched
- [list of scoring-related files in the diff]

### Classification
- **No-op changes:** [list]
- **Behavior changes:** [list — or "none"]

### Verdict
Pass / Block — Storm approval required

### If blocked
- What the change does to the score
- What input value would produce different output before/after
- Which part of `specs/REVIEW-SYSTEM.md` needs updating if the change ships
```

## Golden rule

The scoring system is not a refactor target. Refactors that are "functionally equivalent" have broken scoring in the past. Assume any touch is behavioral until proven otherwise with a regression test that demonstrates identical output across a realistic input range.

## Tier

Quick. Run before every commit that touches the review or rating code paths.
