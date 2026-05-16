---
name: systematic-debugging
description: |
  ALWAYS use when investigating bugs, errors, or unexpected behavior. Enforces
  investigate-before-fix discipline. Do NOT use for feature development or
  code review.
---

## Phase 1: Reproduce
1. Get exact reproduction steps — if you can't reproduce, you can't fix
2. Document expected vs. actual behavior precisely
3. Determine if deterministic or intermittent
4. If intermittent, identify conditions that increase frequency

**Gate: Do not proceed until reliably reproducible.**

## Phase 2: Isolate
1. Narrow scope — which file, function, line?
2. Binary search — comment out half the code path
3. Check recent changes: `git log`, `git diff` since last working state
4. Check inputs — is the function receiving what it expects?
5. Check assumptions — read the code, don't assume

**Techniques:**
- Targeted logging at decision points (not everywhere)
- Debugger stepping through code path
- Compare working vs. broken states
- Check environment differences (dev/staging/prod)

## Phase 3: Diagnose
1. State root cause in one sentence — if you can't, you haven't found it
2. Distinguish root cause from symptom:
   - Symptom: "500 error"
   - Root cause: "Query joins on nullable column without NULL check"
3. Verify diagnosis explains ALL observed symptoms

**Gate: Do not proceed to fixing until root cause is clearly stated.**

## Phase 4: Fix
1. Write regression test that reproduces bug (must fail)
2. Apply minimal fix addressing root cause
3. Run regression test — must now pass
4. Run full test suite — no other tests break
5. Document findings

## Quality Rubric
| Signal | Good | Bad |
|---|---|---|
| Reproduction | Documented, reliable steps | "It just happens sometimes" |
| Isolation | Narrowed to specific cause | Shotgun changes across files |
| Diagnosis | One-sentence root cause | "Something with the data" |
| Fix | Minimal, targeted, tested | Large diff touching unrelated code |
| Prevention | Regression test added | Same bug can recur |

## Anti-Patterns
- Three fix attempts without a hypothesis = you're guessing
- Reading only top of stack trace — read full trace, find first project-owned frame
- `console.log` debris — branch/stash before adding temp logging
- Fixing symptoms without confirming root cause
