# Tailored — Architecture Reference

Tailored is a self-hostable AI job search assistant. It evaluates job postings against a candidate's profile, generates tailored CVs, scans job portals, and tracks the application pipeline.

Everything runs locally. The CLI and the web frontend share a single SQLite database — results written by either surface are visible in the other immediately.

---

## Monorepo Layout

```
packages/
  agents/   — All agent classes (EvaluationAgent, ScannerAgent, CVAgent, TrackerAgent, BatchAgent)
  db/       — Prisma schema, migrations, shared Prisma client
  cli/      — Commander CLI; maps commands → agent classes → stdout transport
apps/
  web/      — Next.js 16 frontend + API routes; streams agents over SSE
```

Dependency direction: `apps/web` and `packages/cli` both depend on `packages/agents` and `packages/db`. The agent and DB packages have no knowledge of how they are invoked.

---

## Agent Architecture

All agents extend `BaseAgent` from `packages/agents/src/shared/base-agent.ts`.

```
BaseAgent (extends @ag-ui/client AbstractAgent)
  └─ run(input: RunAgentInput): Observable<BaseEvent>
       └─ runSteps(input, signal): AsyncGenerator<BaseEvent>  ← override this
```

`run()` wraps `runSteps()` in an Observable. It emits `RUN_STARTED`, yields every event from the generator, then emits `RUN_FINISHED` (or `RUN_ERROR` on throw). Callers subscribe to the Observable — they never await `runSteps` directly.

### Adding a New Agent

1. Create `packages/agents/src/<name>/<Name>Agent.ts`
2. Extend `BaseAgent`
3. Implement `protected async *runSteps(input, signal): AsyncGenerator<BaseEvent>`
4. Export from `packages/agents/src/index.ts`
5. Add a CLI command in `packages/cli/src/commands/<name>.ts`
6. Add an API route at `apps/web/app/api/agents/<name>/route.ts`

---

## Transport Protocol

Agents emit `BaseEvent` values defined by `@ag-ui/core`. The two transports map the same event stream differently:

| Event type | CLI (stdout) behavior | Web (SSE) behavior |
|---|---|---|
| `RUN_STARTED` | spinner "Running…" | — |
| `STEP_STARTED` | spinner text = stepName | step indicator |
| `STEP_FINISHED` | spinner succeed | step indicator |
| `TEXT_MESSAGE_START` | stop spinner | open message bubble |
| `TEXT_MESSAGE_CONTENT` | `process.stdout.write(delta)` | stream delta to client |
| `TEXT_MESSAGE_END` | newline | close message bubble |
| `RUN_ERROR` | spinner fail + `process.exit(1)` | error toast |
| `RUN_FINISHED` | spinner done; print interrupt message if present | finalize UI |
| `CUSTOM` `pdf-ready` | print PDF path | PDF download link |
| `CUSTOM` `scan-progress-*` | update spinner count | scan progress bar |

The CLI transport lives at `packages/cli/src/transport/stdout.ts`. It returns a `Promise<void>` that resolves when the Observable completes.

---

## CLI

### Invocation

```bash
node packages/cli/dist/index.js <command> [args] [flags]
# or after global install:
tailored <command>
```

### Commands

| Command | Description |
|---|---|
| `eval <url-or-text>` | Evaluate a job posting; writes eval report to DB |
| `scan` | Scan configured portals; saves matching jobs to DB |
| `cv <jobId>` | Generate a tailored CV PDF for a job |
| `tracker list` | List all jobs in the pipeline |
| `tracker update <jobId> <status>` | Update a job's application status |
| `batch <file>` | Evaluate multiple jobs from a URL file |

### Flags (all commands)

| Flag | Effect |
|---|---|
| `--json` | Output JSON to stdout; suppress spinners and color |
| `--debug` | Print tool call and custom events to stderr |

### Exit Codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Agent or runtime error |
| 2 | Config or validation error (missing API key, invalid args) |

---

## Web Frontend

- **Framework**: Next.js 16 (App Router)
- **Agent API routes**: `apps/web/app/api/agents/`
  - `POST /api/agents/evaluate` — streams `EvaluationAgent` over SSE
  - `POST /api/agents/scan` — streams `ScannerAgent` over SSE
  - `POST /api/agents/tracker` — streams `TrackerAgent` over SSE
  - `POST /api/agents/batch` — streams `BatchAgent` over SSE
- **Config routes**: `POST/GET /api/config/profile`, `/api/config/discovery`, `/api/config/resume`
- **SSE**: routes stream AG-UI events as `data: <json>\n\n`; the frontend consumes them with the AG-UI client

Start: `pnpm dev` → http://localhost:3000

---

## Database

- **Engine**: SQLite via Prisma
- **Schema**: `packages/db/prisma/schema.prisma`
- **Default location**: resolved from `DATABASE_URL` env var

### Models

| Model | Purpose |
|---|---|
| `Profile` | Candidate CV, target roles, salary range, scoring weights |
| `DiscoveryPrefs` | Portal list, keywords, archetypes, minimum score filter |
| `ResumePrefs` | CV template, section order, tone, keyword list |
| `Job` | Every job evaluated or scanned; holds score, archetype, eval report |
| `GeneratedResume` | PDF records linked to a Job |

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | **Yes** | Claude API authentication |
| `DATABASE_URL` | No | SQLite path; defaults to `file:./dev.db` relative to schema |
| `RESUME_OUTPUT_DIR` | No | Override PDF output directory (default: `apps/web/public/resumes/`) |
| `BATCH_CONCURRENCY` | No | Parallel eval limit for `batch` command (default: 3) |

The CLI calls `validateEnv()` as the first line of every command handler and exits with code 2 if `ANTHROPIC_API_KEY` is missing.

---

## Development

```bash
pnpm install          # install all workspace deps
pnpm dev              # start Next.js dev server (apps/web)
pnpm build            # build all packages + app
pnpm test             # run vitest across all packages
pnpm db:migrate       # apply Prisma migrations
pnpm db:seed          # seed profile + preferences
pnpm --filter @tailored/cli build   # rebuild CLI only
```

Tests use a separate `TEST_DATABASE_URL` (never `dev.db`).

---

## Slash Commands

Claude Code loads `.claude/skills/tailored/SKILL.md` when you open this repo. It defines `/tailored eval`, `/tailored scan`, `/tailored cv`, `/tailored tracker`, and `/tailored batch` as slash commands that invoke the CLI directly.

See `.claude/skills/tailored/SKILL.md` for command details, onboarding steps, and environment variable reference.
