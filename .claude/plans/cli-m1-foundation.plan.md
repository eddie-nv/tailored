# M1 — CLI Foundation

## Status: done

## Objective

Create `packages/cli/` — a new workspace package with a stdout transport and a working `tailored eval <url|text>` command. This is the minimum viable CLI that proves the pattern: agent runs headlessly, streams output to terminal, writes result to the shared SQLite DB.

## Context

### What exists
- `packages/agents/src/shared/base-agent.ts` — `BaseAgent` extends `AbstractAgent`, exposes `run(input: RunAgentInput): Observable<BaseEvent>`
- `packages/agents/src/shared/transport.ts` — converts Anthropic SDK stream → AG-UI `BaseEvent`
- `packages/agents/src/evaluation/EvaluationAgent.ts` — takes `state.pendingJobId` (string) + `state.jobDescription` (string); creates/updates the `Job` row in SQLite; emits step events + streaming text
- `packages/db/` — Prisma client, `Job` model, `GeneratedResume` model
- Web runs agents via HTTP SSE at `/api/agents/*`; CLI will invoke them directly

### What doesn't exist
- `packages/cli/` — nothing here yet
- No stdout transport — the only transport is the HTTP SSE bridge in `apps/web/`
- No `bin/tailored` executable

### Key AG-UI types (from `@ag-ui/core`)
```typescript
interface RunAgentInput {
  threadId: string
  runId: string
  messages: Message[]
  state?: Record<string, unknown>
}
// BaseEvent subtypes used in stdout transport:
// EventType.RUN_STARTED, RUN_FINISHED, RUN_ERROR
// EventType.STEP_STARTED, STEP_FINISHED
// EventType.TEXT_MESSAGE_START, TEXT_MESSAGE_CONTENT, TEXT_MESSAGE_END
// EventType.TOOL_CALL_START, TOOL_CALL_ARGS, TOOL_CALL_END
```

### How EvaluationAgent is invoked (web pattern to replicate in CLI)
```typescript
// From apps/web/app/api/agents/evaluation/route.ts (approximate)
const agent = new EvaluationAgent()
const input: RunAgentInput = {
  threadId: `thread-${jobId}`,
  runId: `run-${Date.now()}`,
  messages: [],
  state: { pendingJobId: jobId, jobDescription: rawText }
}
agent.run(input).subscribe(event => /* send SSE */)
```

## Files to Create

### `packages/cli/package.json`
```json
{
  "name": "@tailored/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": { "tailored": "./dist/index.js" },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@tailored/agents": "workspace:*",
    "@tailored/db": "workspace:*",
    "commander": "^12.0.0",
    "ora": "^8.0.0",
    "chalk": "^5.3.0",
    "@ag-ui/core": "*"
  },
  "devDependencies": {
    "typescript": "*",
    "vitest": "*",
    "@types/node": "*"
  }
}
```

### `packages/cli/tsconfig.json`
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022"
  },
  "include": ["src/**/*"]
}
```

### `packages/cli/src/index.ts`
Commander root. Registers `eval` subcommand. Adds `#!/usr/bin/env node` shebang.

```typescript
#!/usr/bin/env node
import { Command } from 'commander'
import { evalCommand } from './commands/eval.js'

const program = new Command()
  .name('tailored')
  .description('AI-powered job search assistant')
  .version('0.1.0')

program.addCommand(evalCommand)
program.parse()
```

### `packages/cli/src/transport/stdout.ts`
Subscribes to `Observable<BaseEvent>`, maps event types to terminal output.

Mapping rules:
- `RUN_STARTED` → start ora spinner with "Running…"
- `STEP_STARTED` → update spinner text to `event.stepName`
- `TEXT_MESSAGE_CONTENT` → `process.stdout.write(event.delta)` (no newline — streaming)
- `TEXT_MESSAGE_END` → write `\n`
- `STEP_FINISHED` → succeed spinner step (tick)
- `RUN_FINISHED` → stop spinner, print success
- `RUN_ERROR` → stop spinner, `process.stderr.write(error)`, `process.exit(1)`
- `TOOL_CALL_*` → skip unless `--debug` flag

Exports: `subscribeToStdout(obs: Observable<BaseEvent>, opts?: { json?: boolean, debug?: boolean }): Promise<void>`

When `--json`: buffer all `TEXT_MESSAGE_CONTENT` deltas, suppress spinner, print final JSON object `{ report: string }` at end.

### `packages/cli/src/commands/eval.ts`
The `tailored eval <input>` command.

Steps:
1. Validate `ANTHROPIC_API_KEY` present (call `validateEnv()`)
2. Detect if `input` is a URL or raw text
3. Create a `Job` row in DB: `prisma.job.create({ data: { company: 'Unknown', role: 'Unknown', url, source: 'direct', status: 'new' } })`
4. Build `RunAgentInput` with `state: { pendingJobId: job.id, jobDescription: input }`
5. Instantiate `EvaluationAgent`, call `.run(input)`
6. Pipe through `subscribeToStdout()`
7. On completion, print job ID so user can reference it

### `packages/cli/src/utils/env.ts`
```typescript
export function validateEnv(): void {
  if (!process.env['ANTHROPIC_API_KEY']) {
    console.error('Error: ANTHROPIC_API_KEY is not set.')
    console.error('Add it to .env.local or export it in your shell.')
    process.exit(2)
  }
}
```

### `packages/cli/src/utils/db.ts`
```typescript
import { PrismaClient } from '@tailored/db'
export const prisma = new PrismaClient()
```

### `packages/cli/__tests__/transport.test.ts`
Unit tests for `subscribeToStdout`:
- `RUN_ERROR` event causes `process.exit(1)` (mock process.exit)
- Streaming text events are written to stdout in order
- `--json` flag buffers and outputs JSON at end

## Files to Modify

### Root `package.json`
Add `@tailored/cli` to pnpm workspaces (if not auto-detected from `packages/*`).
Add script: `"cli": "node packages/cli/dist/index.js"`

## Implementation Steps

1. Create `packages/cli/` directory structure
2. Write `package.json`, `tsconfig.json`
3. Write `src/utils/env.ts`, `src/utils/db.ts`
4. Write `src/transport/stdout.ts`
5. Write `src/commands/eval.ts`
6. Write `src/index.ts`
7. Write `__tests__/transport.test.ts`
8. Run `pnpm install` to link workspace deps
9. Run `pnpm --filter @tailored/cli build`
10. Smoke test: `node packages/cli/dist/index.js eval "https://jobs.ashby.com/example"`

## Verification Criteria

- [ ] `pnpm --filter @tailored/cli typecheck` passes with zero errors
- [ ] `pnpm --filter @tailored/cli test` passes
- [ ] `tailored eval <url>` streams evaluation output to terminal
- [ ] After run, `Job` row exists in SQLite with `evalReport` populated
- [ ] Missing `ANTHROPIC_API_KEY` exits with code 2 and clear message
- [ ] `tailored eval --json <url>` outputs JSON to stdout
