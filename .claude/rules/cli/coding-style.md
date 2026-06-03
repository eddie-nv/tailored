# CLI Coding Style

## Package Structure

```
packages/cli/
├── src/
│   ├── index.ts           # Commander root, shebang, command registration
│   ├── commands/          # One file per subcommand
│   ├── transport/
│   │   └── stdout.ts      # Observable<BaseEvent> → terminal output
│   └── utils/
│       ├── db.ts          # Shared Prisma client
│       ├── env.ts         # validateEnv() — fail fast on missing config
│       └── table.ts       # ASCII table formatter
└── __tests__/
```

## Command Pattern

Every command file exports a Commander `Command` instance. Business logic stays in the command handler, not in `index.ts`.

```typescript
import { Command } from 'commander'
import { validateEnv } from '../utils/env.js'

export const evalCommand = new Command('eval')
  .description('Evaluate a job posting')
  .argument('<input>', 'Job URL or raw description text')
  .option('--json', 'Output JSON instead of formatted terminal output')
  .option('--debug', 'Show tool call events')
  .action(async (input, opts) => {
    validateEnv()
    // ...
  })
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Agent or runtime error |
| 2 | Config or validation error (missing API key, invalid args) |

Never call `process.exit()` in `transport/` or `utils/` — only in command `.action()` handlers or in `validateEnv()`.

## Observable → Promise

Commands `await` the transport subscription. Never leave an unsubscribed Observable.

```typescript
// Good
await subscribeToStdout(agent.run(input), opts)

// Bad — fire and forget
agent.run(input).subscribe(...)
```

## DB Access

Use the shared `prisma` client from `utils/db.ts`. Never import `PrismaClient` directly in command files.

```typescript
import { prisma } from '../utils/db.js'
```

## Env Validation

Always call `validateEnv()` as the first line of every command `.action()`. Do not proceed if `ANTHROPIC_API_KEY` is missing.

## .js Extensions in Imports

TypeScript ESM requires explicit `.js` extensions in relative imports even for `.ts` source files:

```typescript
import { validateEnv } from '../utils/env.js'  // correct
import { validateEnv } from '../utils/env'      // breaks at runtime
```

## IDs for RunAgentInput

Use `crypto.randomUUID()` for `threadId` and `runId`. Do not use `Date.now()` (breaks deterministic tests).

```typescript
const input: RunAgentInput = {
  threadId: crypto.randomUUID(),
  runId: crypto.randomUUID(),
  messages: [],
  state: { ... }
}
```

## Output Formatting

- Normal output goes to `process.stdout`
- Errors and warnings go to `process.stderr`
- When `--json` flag is set, output only valid JSON to stdout — no spinners, no color, no extra text
- Use `chalk` for color; respect `NO_COLOR` env var (chalk does this automatically)

## Testing

- Unit tests for `transport/stdout.ts` — mock `process.stdout.write` and `process.exit`
- Integration tests use a dedicated test SQLite DB (`TEST_DATABASE_URL`), never `dev.db`
- Spy on agent constructors to avoid real API calls in unit tests
- Use `vitest` consistent with the rest of the monorepo
