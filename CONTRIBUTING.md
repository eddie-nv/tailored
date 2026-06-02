# Contributing to Tailored

## Development setup

Follow the [quickstart in README.md](README.md#quickstart). Make sure `pnpm dev` starts without errors before making changes.

## Project structure

```
packages/agents/src/
  shared/
    base-agent.ts     # extend this for every new agent
    transport.ts      # Claude stream → AG-UI event bridge
    state.ts          # AppState type + loadAppState helper
    errors.ts         # emitRunError, wrapWithAbort
  orchestrator/       # routes chat intent to specialist agents
  evaluation/         # 5-step JD → score + report pipeline
  scanner/            # portal API clients
  batch/              # concurrent eval with CUSTOM event envelope
  cv/                 # keyword injection + Playwright PDF
  tracker/            # STATE_SNAPSHOT / DELTA mutations
```

## Adding an agent

1. Create `packages/agents/src/<name>/YourAgent.ts` extending `BaseAgent`
2. Implement `run(input: RunAgentInput): Observable<BaseEvent>`
3. Emit `RUN_STARTED` first and `RUN_FINISHED` last — the base class handles the wrapper
4. Wire a route at `apps/web/app/api/agents/<name>/route.ts` using `createAgentHandler`
5. Add tests in `packages/agents/src/__tests__/`

## Adding a portal to the scanner

Portals are defined in `packages/agents/src/scanner/portals.ts`. Each entry needs:
- `key`: unique identifier
- `name`: display name
- `platform`: ATS platform (ashby | greenhouse | lever | wellfound | workable | remotefront)
- `fetchJobs(prefs)`: async function returning `ScannedJob[]`

## Commit conventions

```
feat: short description
fix: short description
refactor: short description
docs: short description
test: short description
chore: short description
```

One logical change per commit. No co-authored-by or attribution lines needed.

## Pull requests

- Branch from `main`, name it `<type>/<short-slug>`
- Include a test plan checklist in the PR body
- All typecheck and lint checks must pass before requesting review
- For agent changes, include a prompt eval result or a short recorded interaction showing the behavior

## Running checks

```bash
pnpm typecheck   # TypeScript — must be zero errors
pnpm lint        # ESLint — must be zero errors (warnings ok)
pnpm test        # Vitest unit tests
```
