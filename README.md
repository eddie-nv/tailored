# Tailored

Self-hostable AI job search assistant built on the [AG-UI protocol](https://github.com/ag-ui-protocol/ag-ui). Paste a job URL, get an A-F score against your profile, generate a tailored PDF resume, and track your pipeline — all powered by Claude.

## Prerequisites

- Node.js 20+
- pnpm 9+
- An [Anthropic API key](https://console.anthropic.com/)

## Quickstart

1. Clone the repo
   ```bash
   git clone https://github.com/eddie-nv/tailored && cd tailored
   ```

2. Copy the example env file and add your API key
   ```bash
   cp .env.example apps/web/.env.local
   # Edit apps/web/.env.local — set ANTHROPIC_API_KEY
   ```

3. Run setup (installs deps, runs migrations, seeds the DB, installs Playwright Chromium for PDF export)
   ```bash
   ./setup.sh
   ```

4. Start the dev server
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Architecture

```
tailored/
├── apps/web/                  # Next.js 16 App Router — UI + API routes
├── packages/agents/           # AG-UI agents (Claude-backed)
│   ├── orchestrator/          # Intent classification + routing
│   ├── evaluation/            # 5-step JD evaluation → A-F score + 6-block report
│   ├── scanner/               # Portal scraping (Ashby, Greenhouse, Lever, …)
│   ├── batch/                 # Concurrent multi-job evaluation
│   ├── cv/                    # Keyword injection + Playwright PDF generation
│   ├── tracker/               # STATE_SNAPSHOT/DELTA mutations (CRUD)
│   └── shared/                # Transport, AppState, BaseAgent, error helpers
└── packages/db/               # Prisma + SQLite schema
```

```
Browser ──POST──► /api/agents/<agent>
                      │
                  SSE stream (AG-UI events)
                      │
              packages/agents/<agent>
                      │
              Anthropic Claude API
```

**Event flow:** every agent emits AG-UI events over SSE. The UI subscribes and applies `STATE_SNAPSHOT` / `STATE_DELTA` (RFC 6902 JSON patches) to update local state without a full reload.

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | — | Anthropic API key |
| `DATABASE_URL` | Yes | `file:./dev.db` | SQLite path (absolute path recommended) |
| `BATCH_CONCURRENCY` | No | `5` | Max parallel evaluations in batch mode |
| `RESUME_OUTPUT_DIR` | No | `apps/web/public/resumes` | Where generated PDFs are written |
| `RATE_LIMIT_RPM` | No | `10` | Max agent requests per minute per IP |
| `ALLOWED_ORIGIN` | No | `http://localhost:3000` | CORS allowed origin for production |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
