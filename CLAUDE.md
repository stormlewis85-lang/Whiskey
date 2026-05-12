# CLAUDE.md

## Rules
- NEVER write code, create files, or build unless Storm explicitly says "build", "create", "code", or "ship".
- ALWAYS read TASKS.md before starting work. Resume where the last session left off.
- ALWAYS check DECISIONS.md before making architectural choices. Do not re-decide what's been decided.
- ALWAYS check RESEARCH.md before investigating previously researched topics.
- ALWAYS assign a scope tier (Quick/Standard/Deep) before activating agents.
- ALWAYS use Done/Open/Watch format for handoffs between agents.
- ALWAYS flag blockers immediately. Do not guess at solutions.
- NEVER skip QA sign-off before marking work complete.
- ONE question to Storm at a time. Do not frontload.
- Be brief by default. Offer to elaborate when depth might help.

## Pipeline
Storm → PM → Research → Architect → Developer → Test → QA → Docs
PM determines which steps apply per task. Not every task uses every step.

## Agent Delegation Rules
- When spawning @explore, specify EXACTLY which files or directories to examine and what question to answer. Never say "explore the codebase" — say "read src/lib/format-date.ts and src/db/schema.ts and report the date handling patterns." Cap explore at 5 files unless PM explicitly approves more.
- For ANY task that touches more than 3 files or involves refactoring: delegate to subagents, do not handle in main context.
- Use the Explore-Plan-Execute pattern: spawn explore subagent first to map files, then plan subagent to design approach, then execute.
- ALWAYS delegate testing to the test subagent — Developer does NOT write tests.
- ALWAYS delegate code review to the qa subagent — the agent that wrote code does NOT review it.
- When delegating, include in the prompt: exact file paths, what to look for, pattern to follow, and scope boundary.
- DO NOT role-play agent phases in one context. If PM says "route through the team," spawn actual subagents.
- You can invoke subagents explicitly with @agent-name.

## Agents
- Subagents: `.claude/agents/` — each has defined authority and constraints in its system prompt.
- PM Agent is the orchestrator. All work flows through PM.
- Activate minimum viable team per task.

## Project State
- `TASKS.md` — Single source of truth for project state (PM-owned)
- `DECISIONS.md` — Architectural and feature decisions with rationale
- `RESEARCH.md` — Research findings and landscape analysis
- `CONTEXT_PROJECT.md` — Project-specific details, tech stack, active specialists
- `CONTEXT_MASTER.md` — Universal standards (in agents-master/)

## Scope Tiers
- **Quick** — One agent, minimal context, short response.
- **Standard** — Normal pipeline, concise. Most work falls here.
- **Deep** — Full research, architecture review, multi-agent. Major decisions only.
