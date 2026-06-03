# M4 — Dual-Mode Parity

## Status: done
## Depends on: [M3 — SKILL.md + Claude Code](cli-m3-skill.plan.md)

## Objective

Full feature parity between CLI and web. After M4: batch evaluation from a file, shell completions for `tailored`, and an integration test suite that runs both CLI and web against the same DB — proving the dual-mode contract is stable.

## Context

### What M3 delivered
- Claude Code slash commands wired to CLI
- `CLAUDE.md` architecture docs
- Skill file finalized

### Remaining gaps vs career-ops
- No batch command (career-ops has `/career-ops batch <tsv>`)
- No shell completions (career-ops users get these via their shell)
- No integration test that exercises both paths against one DB

## Files to Create

### `packages/cli/src/commands/batch.ts`
```
tailored batch <file> [--concurrency <n>] [--json]
```

`<file>` is a newline-separated list of job URLs (one per line, blank lines and `#` comments ignored).

Steps:
1. `validateEnv()`
2. Read and parse the file
3. Create a stub `Job` row for each URL (`status: 'new'`)
4. Run evaluations with bounded concurrency (default 3, matches `BATCH_CONCURRENCY` env)
5. For each job: instantiate `EvaluationAgent`, call `.run()`, subscribe
6. Print progress as jobs complete: `[2/10] ✓ Anthropic — Staff Engineer`
7. On all complete, print summary table (company, role, score, jobId)

Uses `p-limit` or a manual semaphore — same pattern as `packages/agents/src/batch/BatchAgent.ts`.

### `packages/cli/src/commands/completions.ts`
```
tailored completions <shell>   # shell: bash | zsh | fish
```

Generates shell completion script for the current command tree. Uses Commander's built-in completion support or hand-authored completion script.

Output goes to stdout so user can source it:
```bash
tailored completions zsh > ~/.zsh/completions/_tailored
```

### `packages/cli/__tests__/integration.test.ts`
Tests that CLI and web share state correctly.

Test cases:
1. CLI `eval` → fetch job via `GET /api/jobs` → report present
2. CLI `scan` → job count in DB increases → `GET /api/jobs` returns new jobs
3. CLI `cv <id>` → `GET /api/resumes/<generatedResumeId>` returns PDF
4. Web creates job (via `POST /api/jobs`) → CLI `tracker list` shows it
5. CLI `tracker update <id> applied` → `GET /api/jobs/<id>` returns `status: applied`

Setup: spin up Next.js test server with `VITEST_SETUP` using `next/server` or `supertest`. Use a test-specific `DATABASE_URL` pointing to `test.db` (not `dev.db`).

## Files to Modify

### `packages/cli/src/index.ts`
Register new commands:
```typescript
program.addCommand(batchCommand)
program.addCommand(completionsCommand)
```

### `.claude/skills/tailored/SKILL.md`
Add `/tailored batch <file>` command definition.

### `packages/cli/package.json`
Add `p-limit` dependency for batch concurrency.

## Implementation Steps

1. Write `src/commands/batch.ts`
2. Write `src/commands/completions.ts`
3. Update `src/index.ts` to register both
4. Update SKILL.md with `/tailored batch`
5. Write `__tests__/integration.test.ts`
6. Run integration tests against a clean test DB
7. Smoke test `tailored completions zsh` → source in shell → verify tab completion works

## Verification Criteria

- [ ] `tailored batch jobs.txt` evaluates all URLs, prints progress + summary table
- [ ] Batch respects `--concurrency` flag and `BATCH_CONCURRENCY` env var
- [ ] `tailored completions zsh` outputs a valid completion script
- [ ] After sourcing completions, `tailored <tab>` shows subcommands
- [ ] Integration tests pass (`pnpm --filter @tailored/cli test`)
- [ ] CLI eval result visible in web frontend (no app restart needed)
- [ ] Web-created job visible in CLI tracker list
- [ ] `/tailored batch` slash command recognized in Claude Code
