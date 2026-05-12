---
name: pm-handoff
description: |
  ALWAYS load when delegating work to a subagent. Use before every @explore, @developer,
  @test, @qa, @architect, or any other subagent spawn. Forces structured handoff format
  that prevents vague delegation and token blowout. Do NOT skip this for any delegation.
---

# PM Handoff Protocol

When spawning ANY subagent, your delegation prompt MUST include ALL of these fields. Do not delegate without them.

## Required Handoff Fields

```
TASK: [one-line description]
SCOPE: Quick | Standard | Deep
FILES TO READ: [exact paths — max 5 for Quick, max 10 for Standard]
FILES TO CREATE/MODIFY: [exact paths]
PATTERN TO FOLLOW: [exact file to match, if applicable]
ACCEPTANCE CRITERIA: [what "done" looks like — testable, not vague]
DO NOT: [explicit boundaries — what to avoid, where not to explore]
```

## Rules

- NEVER say "explore the codebase" — specify which files and what question to answer.
- NEVER delegate without file paths. If you don't know the paths, use Glob/Grep to find them BEFORE spawning the subagent.
- Cap @explore at 5 files for Quick, 10 for Standard. If more are needed, state why.
- Cap @developer at the files listed in FILES TO CREATE/MODIFY. No scope creep.
- @test receives the source file path AND the test pattern to follow. Nothing else.
- @qa receives only the files that changed and the acceptance criteria. No exploration.

## Examples

### Good handoff (to @developer):
```
TASK: Add zero-padded CAPA ID formatter
SCOPE: Quick
FILES TO READ: src/lib/format-id.ts (existing pattern)
FILES TO CREATE/MODIFY: src/lib/format-capa-id.ts
PATTERN TO FOLLOW: src/lib/format-id.ts
ACCEPTANCE CRITERIA: formatCapaId(42) returns "CAPA-0042", handles null/undefined with "—"
DO NOT: modify any existing files, explore beyond src/lib/
```

### Bad handoff (causes token blowout):
```
Build a CAPA ID formatter. Look at the codebase to understand the patterns.
```

### Good handoff (to @explore):
```
TASK: Find all date formatting patterns in the codebase
SCOPE: Quick
FILES TO READ: src/components/capa-list.tsx, src/components/capa-detail.tsx, src/components/timeline.tsx
ACCEPTANCE CRITERIA: List every .toLocaleDateString() or date formatting call with file path and line
DO NOT: read files outside src/components/, do not suggest fixes
```
