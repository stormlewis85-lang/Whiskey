---
name: pr-workflow
description: |
  ALWAYS use when opening PRs, writing PR descriptions, drafting changelog entries,
  or running merge-readiness checks. Do NOT use for code review content (see
  code-review-checklist) or branching strategy (see git-workflow).
---

## PR Description (required fields)
- **Title:** Conventional commit format, < 70 chars
- **Summary:** 1-3 bullets — what changed and why
- **Test plan:** How to verify changes work
- **Related issues:** Links to tasks/issues

## PR Template
```markdown
## Summary
- [What changed and why — 1-3 bullets]

## Test Plan
- [ ] [How to verify change 1]
- [ ] [How to verify change 2]

## Related
- Closes #[issue]
- Task: [TASKS.md reference]

## Changelog
- [Category]: [Description]
```

## Changelog Format (Keep a Changelog)
```markdown
## [Unreleased]
### Added
- [Description] (#PR)
### Changed
- [Description] (#PR)
### Fixed
- [Description] (#PR)
```

## Review Assignment
| Change Type | Reviewers |
|---|---|
| Feature | QA + Architect (if structural) |
| Bug fix | QA |
| Refactor | QA + Architect |
| Docs only | QA (light) |
| Security-sensitive | QA + Security |
| Database/schema | Architect + QA |

## Merge Checklist
- [ ] PR description complete (summary, test plan, related)
- [ ] All CI checks pass
- [ ] Required reviewers approved
- [ ] No unresolved review comments
- [ ] Changelog updated (if user-facing)
- [ ] DECISIONS.md updated (if architectural)
- [ ] Squash merge to main
