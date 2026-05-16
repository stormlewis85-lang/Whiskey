---
name: code-review-checklist
description: |
  ALWAYS use when reviewing code changes, PRs, or diffs. Use for pre-ship quality
  checks. Covers correctness, security, performance, maintainability. Do NOT use
  for architecture decisions or initial code writing.
---

## Procedure
1. Read PR description and linked task — understand intent
2. Run checklist below, flag issues by severity:
   - **Blocker:** Must fix before merge
   - **Warning:** Should fix, not a merge blocker
   - **Nit:** Style preference, take or leave
3. Lead with what's good. Be specific (file, line, what's wrong). Suggest fixes.

## Checklist

### Correctness
- [ ] Code does what the PR description says
- [ ] Edge cases handled (null, empty, boundary values)
- [ ] Error paths handled gracefully (not swallowed)
- [ ] No existing functionality broken

### Security
- [ ] No hardcoded secrets or credentials
- [ ] User input validated and sanitized
- [ ] SQL queries parameterized
- [ ] Auth checks on protected routes
- [ ] Dependencies from trusted sources, no known CVEs

### Performance
- [ ] No N+1 queries or unnecessary loops
- [ ] Large data sets paginated or streamed
- [ ] No expensive operations in hot paths without caching
- [ ] No sync blocking where async available

### Maintainability
- [ ] Follows PATTERNS.md conventions
- [ ] Names are clear and self-documenting
- [ ] No unnecessary complexity or over-engineering
- [ ] No dead code, unused imports, commented-out blocks
- [ ] Changes minimal — no scope creep

### Tests
- [ ] New/changed code has tests
- [ ] Tests cover happy path and error cases
- [ ] Tests readable and maintainable
- [ ] No flaky tests introduced

## Anti-Patterns
- Reviewing only style while missing logic bugs
- Rubber-stamping "LGTM" without reading code
- Blocking on subjective preferences — save nits for low-severity
- Reviewing in isolation — check how change fits broader system
- Diffs over 400 lines get skimmed; ask author to split first
