# M3 — SKILL.md + Claude Code Integration

## Status: done
## Depends on: [M2 — Core Commands](cli-m2-commands.plan.md)

## Objective

Make Claude Code natively aware of tailored. After M3, opening the repo in Claude Code gives access to `/tailored eval`, `/tailored scan`, `/tailored cv`, and `/tailored tracker` as slash commands that invoke the CLI. A root `CLAUDE.md` documents the architecture for any agent or developer opening the repo cold.

## Context

### How Claude Code skills work
A skill is a markdown file at `.claude/skills/<name>/SKILL.md`. Claude Code loads it as part of its context when working in the repo. Slash commands defined in the skill file are mapped to shell commands that Claude Code can execute on the user's behalf.

Career-ops uses this pattern with `.claude/skills/career-ops/SKILL.md` — it defines `/career-ops eval`, `/career-ops scan`, etc. and maps each to a Node.js script invocation.

### What M2 delivered
- `packages/cli/dist/index.js` — compiled CLI entry point
- All four commands working: `eval`, `scan`, `cv`, `tracker`
- Shared DB writes visible in web frontend

### Scaffold already in place
`.claude/skills/tailored/SKILL.md` was created as part of this roadmap setup. M3 finalizes its content once the CLI is proven.

## Files to Create

### `CLAUDE.md` (repo root)
Architecture documentation for agents and developers opening the repo cold. Sections:

1. **What this is** — Tailored is a self-hostable AI job search assistant
2. **Monorepo layout** — packages/agents, packages/db, packages/cli, apps/web
3. **Agent architecture** — BaseAgent → runSteps() async generator → Observable<BaseEvent>; how to add a new agent
4. **Transport protocol** — AG-UI event types, what each means, how stdout transport maps them
5. **CLI** — `tailored <command>` invocation, all commands, flags, exit codes
6. **Web** — Next.js 16, API routes at `/api/agents/*`, SSE stream, AG-UI client
7. **DB** — Prisma + SQLite, `dev.db` is shared between CLI and web
8. **Environment variables** — full table (ANTHROPIC_API_KEY, DATABASE_URL, RESUME_OUTPUT_DIR, etc.)
9. **Development** — `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm db:migrate`
10. **Slash commands** — brief pointer to `.claude/skills/tailored/SKILL.md`

### `.claude/skills/tailored/SKILL.md` (finalize)
The skill file that Claude Code loads. See scaffold at `.claude/skills/tailored/SKILL.md`.

After M2 is verified, update the skill file to confirm:
- All commands are tested and working
- Correct binary path (`node packages/cli/dist/index.js` or `pnpm cli`)
- Onboarding validation steps reflect actual setup

## Files to Modify

None — skill auto-loads when Claude Code opens the repo.

## Implementation Steps

1. Write root `CLAUDE.md` covering all 10 sections above
2. Finalize `.claude/skills/tailored/SKILL.md` — verify command paths match actual CLI output from M2
3. Open Claude Code in the repo root
4. Type `/tailored` — confirm the slash command is recognized
5. Run `/tailored tracker` — confirm it executes `node packages/cli/dist/index.js tracker list`
6. Run `/tailored eval <a real job url>` — confirm streaming output and DB write

## Verification Criteria

- [ ] `CLAUDE.md` exists at repo root with all 10 sections
- [ ] `.claude/skills/tailored/SKILL.md` matches actual CLI command paths
- [ ] Claude Code recognizes `/tailored` slash commands
- [ ] `/tailored eval <url>` streams output in Claude Code terminal
- [ ] `/tailored scan` runs and reports found jobs
- [ ] `/tailored tracker` lists jobs in Claude Code output
- [ ] `/tailored cv <id>` generates PDF and prints path
- [ ] All commands write to DB; web frontend reflects results
