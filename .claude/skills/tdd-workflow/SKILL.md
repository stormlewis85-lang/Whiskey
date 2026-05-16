---
name: tdd-workflow
description: |
  Use when building features with clear requirements, fixing bugs (failing test first),
  or refactoring with safety net. Enforces Red-Green-Refactor discipline.
  Do NOT use for exploratory prototyping or spike work.
---

## Red-Green-Refactor Cycle

### Red (Write Failing Test)
1. Read spec/acceptance criteria for current task
2. Write simplest test capturing one requirement
3. Run test — **must fail**. If it passes, test isn't testing anything new
4. Verify failure message is clear and points to right thing

### Green (Make It Pass)
1. Write **minimum code** to make failing test pass
2. Don't optimize, generalize, or clean up — just make it green
3. Run all tests — new passes, none break
4. If existing tests break, fix implementation first

### Refactor (Clean Up)
1. Improve code — extract functions, rename, simplify
2. Run all tests after every refactor step — must stay green
3. Don't add new behavior during refactoring (that's a new Red phase)
4. Commit when refactor complete and tests pass

### Cycle Timing
Each Red-Green-Refactor: 5-15 minutes. If longer, the step is too big — break it down.

## Quality Signals
| Signal | Yes | No |
|---|---|---|
| Tests before code? | Each test fails before impl | Tests written after |
| Minimal impl? | Only enough to pass | Gold-plating, premature optimization |
| Refactor separate? | After green, not during | Mixing new behavior with cleanup |
| Small cycles? | 5-15 min | Long feedback loops |
| Tests describe behavior? | Names read like requirements | Names describe implementation |

## Anti-Patterns
- Writing test after code and calling it TDD — commit history should show test before impl
- Skipping Refactor because code "works" — compounding quality comes from this step
- Over-mocking in Red — 10 mocks = design problem, unit has too many collaborators
- Testing implementation details (private methods, internal state) instead of behavior
