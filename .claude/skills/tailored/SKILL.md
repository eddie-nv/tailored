# Tailored — Claude Code Skill

You are operating as the Tailored job search assistant inside Claude Code. Tailored evaluates job postings against a candidate's profile and resume, generates tailored CVs, scans job portals, and tracks the application pipeline.

All state lives in a local SQLite database. The CLI and the web frontend share the same DB — results written by the CLI appear in the web frontend immediately, and vice versa.

---

## Onboarding Checks

Before running any command, confirm:

1. **CLI is built** — `packages/cli/dist/index.cjs` exists. If not: `pnpm --filter @tailored/cli build`
2. **API key is set** — `.env.local` contains `ANTHROPIC_API_KEY=sk-ant-...`
3. **DB is migrated** — run `pnpm db:migrate` if `apps/web/prisma/dev.db` does not exist
4. **Profile is seeded** — run `pnpm db:seed` if no profile exists in the DB

---

## Slash Commands

### /tailored eval \<url-or-text\>

Evaluate a job posting. Pass a full URL or paste raw job description text.

```bash
node packages/cli/dist/index.cjs eval "<url-or-text>"
```

What it does:
- Creates a `Job` row in the DB
- Runs `EvaluationAgent`: archetype detection → scoring → CV match → compensation research → report generation
- Writes the 6-block evaluation report to the `Job.evalReport` column
- Results visible in the web frontend under Results → expand the job row

---

### /tailored scan

Scan configured job portals for new openings that match the candidate's profile.

```bash
node packages/cli/dist/index.cjs scan
```

What it does:
- Reads `DiscoveryPrefs` from DB (portals, keywords, archetypes, minScore)
- Runs `ScannerAgent` against Ashby, Greenhouse, Lever, Wellfound, Workable
- Filters by keywords and archetypes
- Saves matching jobs to DB with `source: 'scan'`
- New jobs appear in web frontend immediately

---

### /tailored cv \<jobId\>

Generate a tailored CV PDF for a specific job.

```bash
node packages/cli/dist/index.cjs cv <jobId>
```

What it does:
- Runs `CVAgent`: keyword injection → HTML render → Playwright PDF
- Saves PDF to `apps/web/public/resumes/<jobId>-<timestamp>.pdf`
- Creates a `GeneratedResume` row in DB
- PDF downloadable from web frontend

To find a `jobId`: run `/tailored tracker` and copy the ID from the table.

---

### /tailored tracker

List all jobs in the pipeline.

```bash
node packages/cli/dist/index.cjs tracker list
```

Add `--json` for machine-readable output:

```bash
node packages/cli/dist/index.cjs tracker list --json
```

---

### /tailored tracker update \<jobId\> \<status\>

Update a job's application status.

```bash
node packages/cli/dist/index.cjs tracker update <jobId> <status>
```

Valid statuses: `new` · `reviewed` · `applied` · `interview` · `offer` · `rejected` · `archived`

---

### /tailored batch \<file\>

Evaluate multiple jobs from a newline-separated URL file.

```bash
node packages/cli/dist/index.cjs batch <file>
```

The file should contain one job URL per line. Blank lines and lines starting with `#` are ignored.

```
# jobs.txt
https://jobs.ashby.com/company/role-1
https://boards.greenhouse.io/company/jobs/123
```

---

## Viewing Results in the Web Frontend

Start the dev server to view all CLI-generated results visually:

```bash
pnpm dev
```

Then open http://localhost:3000 — the Results tab shows all jobs, scores, reports, and CV downloads.

---

## State Location

| Data | Location |
|------|----------|
| Jobs, reports, scores | `apps/web/prisma/dev.db` (SQLite) |
| Generated PDFs | `apps/web/public/resumes/` |
| Profile + preferences | `apps/web/prisma/dev.db` (Profile, DiscoveryPrefs, ResumePrefs tables) |

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | Claude API authentication |
| `DATABASE_URL` | No | Override default `apps/web/prisma/dev.db` |
| `RESUME_OUTPUT_DIR` | No | Override default PDF output directory |
| `BATCH_CONCURRENCY` | No | Parallel eval limit for batch command (default: 3) |

---

## Architecture Reference

See `CLAUDE.md` at the repo root for the full architecture: agent lifecycle, transport protocol, DB schema, and how to add new agents.
