---
name: testing-strategy
description: |
  ALWAYS use when writing tests, reviewing test coverage, or deciding what level of
  testing a feature needs. Covers test pyramid, coverage targets, and what to test.
  Do NOT use for debugging (see systematic-debugging) or TDD rhythm (see tdd-workflow).
---

## What to Test
- Every new function/module → unit tests
- Every integration point (API, DB, external services) → integration tests
- Critical user flows → end-to-end tests
- Bug fixes → regression test reproducing the bug first

## Test Pyramid
- **Unit (70%):** Fast, isolated, test one thing. Mock external deps.
- **Integration (20%):** Components working together. Real deps where practical.
- **E2E (10%):** Complete user flows. Slower, more brittle — critical paths only.

## Writing Tests (AAA Pattern)
1. **Arrange:** Set up data and preconditions
2. **Act:** Execute code under test
3. **Assert:** Verify expected outcome

Test behavior, not implementation — tests should survive refactors.

## Coverage Targets
| Level | Target | Focus |
|---|---|---|
| Unit | 80%+ new code | Logic, calculations, transformations |
| Integration | All endpoints/DB ops | Data flow, contracts |
| E2E | Critical journeys | Full-stack behavior |

## What NOT to Test
- Framework internals or third-party library behavior
- Trivial getters/setters with no logic
- Implementation details that change during refactoring
- Generated code (unless you own the generator)

## Anti-Patterns
- Testing only happy path — bugs live in edge cases
- Mocking everything — over-mocked tests prove nothing
- Writing tests after shipping — test during development
- Chasing 100% coverage — diminishing returns past 80%
- Brittle snapshot tests breaking on every minor change
