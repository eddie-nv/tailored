# CLI + SKILL.md Roadmap

## What We're Building

A CLI layer for `packages/cli/` that lets Claude Code (and the terminal) invoke the same agents the web frontend uses, writing to the same SQLite DB so results appear in both places without sync.

```
Claude Code → /tailored eval <url>
                ↓
         packages/cli/dist/index.js
                ↓
         EvaluationAgent (same TypeScript class)
                ↓
         SQLite (apps/web/prisma/dev.db)
                ↓
         Web frontend reads results at localhost:3000
```

## Milestone Summary

| # | Milestone | Deliverable | Status |
|---|-----------|-------------|--------|
| M1 | CLI Foundation | `packages/cli/` with stdout transport + `tailored eval` | done |
| M2 | Core Commands | `tailored scan`, `tailored cv`, `tailored tracker` | done |
| M3 | SKILL.md + Claude Code | `CLAUDE.md`, `.claude/skills/tailored/SKILL.md`, slash commands | done |
| M4 | Dual-Mode Parity | `tailored batch`, shell completions, integration tests | done |

## Dependency Graph

```
M1 (Foundation)
  └─ M2 (Core Commands)
       └─ M3 (SKILL.md + Claude Code)
            └─ M4 (Dual-Mode Parity)
```

Each milestone is a strict prereq for the next. M3 ships the SKILL.md but the scaffold lives in `.claude/skills/tailored/SKILL.md` from the start.

## Plan Files

- [M1 — CLI Foundation](cli-m1-foundation.plan.md)
- [M2 — Core Commands](cli-m2-commands.plan.md)
- [M3 — SKILL.md + Claude Code](cli-m3-skill.plan.md)
- [M4 — Dual-Mode Parity](cli-m4-parity.plan.md)

## Shared Constraints

- CLI and web MUST write to the same DB (`apps/web/prisma/dev.db` or `DATABASE_URL`)
- CLI transport maps `Observable<BaseEvent>` → stdout; no HTTP layer
- All agents (`EvaluationAgent`, `ScannerAgent`, `CVAgent`, `TrackerAgent`) are invoked directly — no API routes
- `ANTHROPIC_API_KEY` is required at CLI startup; fail fast with a clear message if missing
- Exit codes: `0` success, `1` agent/runtime error, `2` config/validation error
