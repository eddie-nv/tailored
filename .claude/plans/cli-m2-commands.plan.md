# M2 — Core Commands

## Status: done
## Depends on: [M1 — CLI Foundation](cli-m1-foundation.plan.md)

## Objective

Add `tailored scan`, `tailored cv <jobId>`, and `tailored tracker` commands. After M2 every agent the web frontend exposes is also reachable from the terminal. All results write to the shared SQLite DB and surface in the web frontend without any extra sync step.

## Context

### What M1 delivered
- `packages/cli/` package with stdout transport
- `tailored eval` command wired to `EvaluationAgent`
- `validateEnv()`, shared `prisma` client, `subscribeToStdout()`

### Agents to wire

**ScannerAgent** (`packages/agents/src/scanner/ScannerAgent.ts`)
- Reads `DiscoveryPrefs` from DB (portals, keywords, archetypes, minScore)
- Emits scanned jobs as `STATE_DELTA` patches or CUSTOM events
- CLI needs to load prefs from DB and pass them via `state`

**CVAgent** (`packages/agents/src/cv/CVAgent.ts`)
- Takes `state.jobId` (string)
- Fetches job + profile from DB
- Runs keyword injection → template render → Playwright PDF
- Emits step events; final CUSTOM `pdf-ready` carries `{ path, filename }`
- PDF saved to `RESUME_OUTPUT_DIR` or `apps/web/public/resumes/`

**TrackerAgent** (`packages/agents/src/tracker/TrackerAgent.ts`)
- `list` subcommand: loads all jobs, prints table
- `update` subcommand: patches job status via `STATE_DELTA`
- Tracker is primarily a DB read/write operation — may be simpler to query Prisma directly in CLI without invoking the full agent

## Files to Create

### `packages/cli/src/commands/scan.ts`
```
tailored scan [--limit <n>] [--json]
```
Steps:
1. `validateEnv()`
2. Load `DiscoveryPrefs` from DB (`prisma.discoveryPrefs.findFirst()`)
3. Build `RunAgentInput` with `state: { discoveryPrefs }`
4. Instantiate `ScannerAgent`, call `.run(input)`
5. Pipe through `subscribeToStdout()`
6. On completion, print count of new jobs found

### `packages/cli/src/commands/cv.ts`
```
tailored cv <jobId> [--template <default|minimal|dense>] [--json]
```
Steps:
1. `validateEnv()`
2. Verify job exists: `prisma.job.findUniqueOrThrow({ where: { id: jobId } })`
3. Load `ResumePrefs` from DB
4. Build `RunAgentInput` with `state: { jobId, resumePrefs }`
5. Instantiate `CVAgent`, call `.run(input)`
6. Pipe through `subscribeToStdout()`
7. Print PDF output path on completion

### `packages/cli/src/commands/tracker.ts`
```
tailored tracker list [--status <filter>] [--json]
tailored tracker update <jobId> <status>
```

Valid statuses: `new`, `reviewed`, `applied`, `interview`, `offer`, `rejected`, `archived`

`list` implementation:
- Query `prisma.job.findMany({ orderBy: { createdAt: 'desc' } })`
- Format as ASCII table using `src/utils/table.ts`
- `--json` outputs raw array

`update` implementation:
- Validate status against allowed values (exit 2 if invalid)
- `prisma.job.update({ where: { id }, data: { status } })`
- Print confirmation

### `packages/cli/src/utils/table.ts`
ASCII table formatter. Columns for job list: `ID (8 chars)`, `Company`, `Role`, `Score`, `Status`, `Created`.

```typescript
export function formatJobTable(jobs: Job[]): string
```

Uses fixed column widths, truncates long strings with `…`, right-aligns score.

### `packages/cli/__tests__/commands.test.ts`
Integration tests (use a test SQLite DB, not `dev.db`):
- `scan` writes new jobs to DB
- `cv` creates a `GeneratedResume` row and a PDF file on disk
- `tracker list` returns all jobs
- `tracker update` changes job status
- Invalid status exits with code 2

## Files to Modify

### `packages/cli/src/index.ts`
Register three new commands:
```typescript
program.addCommand(scanCommand)
program.addCommand(cvCommand)
program.addCommand(trackerCommand)
```

### `packages/cli/src/transport/stdout.ts`
Add handling for `CUSTOM` events:
- `pdf-ready` → print `\nPDF saved to: {path}`
- `scan-complete` → print `\n{count} new jobs found`

## Implementation Steps

1. Write `src/utils/table.ts`
2. Write `src/commands/scan.ts`
3. Write `src/commands/cv.ts`
4. Write `src/commands/tracker.ts`
5. Update `src/index.ts` to register new commands
6. Update `src/transport/stdout.ts` with CUSTOM event handlers
7. Write `__tests__/commands.test.ts`
8. Build: `pnpm --filter @tailored/cli build`
9. Smoke test each command against a real dev DB

## Verification Criteria

- [ ] `tailored scan` prints a table of new jobs and writes them to DB
- [ ] `tailored cv <id>` generates a PDF and prints its path
- [ ] `tailored tracker list` prints all jobs in a readable table
- [ ] `tailored tracker list --json` outputs a JSON array
- [ ] `tailored tracker update <id> applied` changes status (verify in DB)
- [ ] `tailored tracker update <id> badstatus` exits with code 2
- [ ] `pnpm --filter @tailored/cli test` passes
- [ ] Web frontend shows scan results and CV download after CLI run
