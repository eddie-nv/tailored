# Tailored — MVP Milestone Plan (v2)

**Objective:** Build an open-source, self-hostable AI job search UI on the AG-UI protocol.
**Repo:** https://github.com/eddie-nv/tailored
**Stack:** Next.js App Router · TypeScript · @ag-ui/core · @ag-ui/encoder · @ag-ui/client · Claude API · Prisma · SQLite · Playwright
**Git rule:** Every milestone = branch → commit → push → PR → merge main → pull

> **v2 changes from adversarial review:** Added M2 (AG-UI transport layer) as a mandatory prerequisite for all agents. Split old M4 into M5 + M6. M3/M4 are serial (not parallel). M8 now depends on M5+M6, not M7. M9 security split from M10 performance+OSS. Added CORS, RUN_ERROR, abort handling, Playwright install, and DB bootstrap to correct milestones.

---

## Dependency Graph

```
M0 (scaffold)
  └── M1 (database + build graph)
        └── M2 (AG-UI transport + event contract + shared-state schema)
              └── M3 (app shell + OrchestratorAgent + chat panel)
                    └── M4 (config tab UI)
                          ├── M5 (EvaluationAgent + URL paste)  ─┐
                          └── M6 (Results table + TrackerAgent) ─┘  parallel
                                ├── M7 (ScannerAgent)   ─┐
                                ├── M8 (BatchAgent)      │  parallel
                                ├── M9 (CVAgent + PDF)   │
                                └── M10 (row expand)    ─┘
                                      ├── M11 (security hardening)
                                      └── M12 (performance + OSS packaging)
```

**Three parallel windows:**
- M5 ‖ M6 — after M4
- M7 ‖ M8 ‖ M9 ‖ M10 — after M5+M6
- M11 ‖ M12 — after M10

---

## M0 — Monorepo Scaffold

**Branch:** `milestone/m0-scaffold`

### Context brief
Empty repo at github.com/eddie-nv/tailored. Produce a working pnpm workspace with three packages, correct TypeScript project references, and base dependencies installed. No business logic — just a clean build graph where `pnpm dev`, `pnpm typecheck`, and `pnpm lint` all pass.

### Structure to produce
```
tailored/
├── apps/
│   └── web/                        # Next.js 15 App Router
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── api/agents/         # empty — endpoints added in later milestones
│       ├── package.json
│       ├── tsconfig.json           # extends tsconfig.base.json
│       └── next.config.ts
├── packages/
│   ├── agents/
│   │   ├── src/index.ts            # empty barrel
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── db/
│       ├── prisma/schema.prisma    # stub model only
│       ├── src/index.ts            # empty barrel
│       ├── package.json
│       └── tsconfig.json
├── .env.example                    # ANTHROPIC_API_KEY=, DATABASE_URL=
├── .gitignore
├── pnpm-workspace.yaml
├── package.json                    # root: scripts dev/build/lint/typecheck
└── tsconfig.base.json              # strict, path aliases
```

### Tasks
- [ ] `pnpm-workspace.yaml` pointing to `apps/*` and `packages/*`
- [ ] Root `package.json`: scripts, no runtime deps at root
- [ ] `tsconfig.base.json`: `strict: true`, `moduleResolution: bundler`, `paths` for `@tailored/*`
- [ ] `apps/web`: `create-next-app` — App Router, TypeScript, Tailwind, no src dir
- [ ] `packages/agents/package.json`: name `@tailored/agents`, deps: `@ag-ui/core`, `@ag-ui/encoder`, `@anthropic-ai/sdk`
- [ ] `packages/db/package.json`: name `@tailored/db`, deps: `prisma`, `@prisma/client`
- [ ] Add `@tailored/db` as dependency of `@tailored/agents` — establishes build order for Prisma types
- [ ] Add `@tailored/agents` and `@tailored/db` as deps of `apps/web`
- [ ] `.env.example`: `ANTHROPIC_API_KEY=sk-ant-...`, `DATABASE_URL=file:./dev.db`
- [ ] `.gitignore`: `node_modules`, `.next`, `.env`, `*.db`, `dist`, `.turbo`, `out/`

### .claude configs to use
- **Skill:** `nextjs-turbopack` — App Router setup, Turbopack dev, tsconfig for Next 15
- **Skill:** `coding-standards` — naming, file layout, tsconfig strictness baseline
- **Agent:** `architect` — validate monorepo topology and package graph before writing files

### Verification
```bash
pnpm install          # zero peer-dep errors
pnpm -F web dev       # localhost:3000 responds
pnpm typecheck        # zero errors
pnpm lint             # zero errors
```

### Exit criteria
Three packages exist with correct references. `pnpm dev` starts. Typecheck and lint are green.

---

## M1 — Database Layer

**Branch:** `milestone/m1-database`
**Depends on:** M0

### Context brief
Define the full Prisma schema covering all entities the app needs. Wire `prisma generate` into the workspace build so `@tailored/db` exports generated types before `@tailored/agents` compiles. Include a seed script and unit tests per model.

### Schema
```prisma
model Profile {
  id             String   @id @default(cuid())
  cv             String
  targetRoles    String   // JSON string[]
  salaryMin      Int?
  salaryMax      Int?
  location       String?
  workType       String?  // "remote"|"hybrid"|"onsite"
  scoringWeights String   // JSON object
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model DiscoveryPrefs {
  id         String   @id @default(cuid())
  portals    String   // JSON string[] of portal keys
  keywords   String   // JSON string[]
  archetypes String   // JSON string[]
  minScore   String?  // "A"|"B"|"C"|"D"|"F"
  updatedAt  DateTime @updatedAt
}

model ResumePrefs {
  id           String   @id @default(cuid())
  template     String   @default("default")
  sectionOrder String   // JSON string[]
  tone         String?
  keywords     String   // JSON string[]
  updatedAt    DateTime @updatedAt
}

model Job {
  id          String   @id @default(cuid())
  company     String
  role        String
  url         String?  @unique
  source      String   // "direct"|"scan"
  archetype   String?
  score       String?  // "A"|"B+"|"B"|"C"|"D"|"F"
  cvMatchPct  Int?
  evalReport  String?  // JSON: 6-block report object
  status      String   @default("new")
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  resumes     GeneratedResume[]
}

model GeneratedResume {
  id        String   @id @default(cuid())
  jobId     String
  job       Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  filename  String
  path      String
  createdAt DateTime @default(now())
}
```

### Tasks
- [ ] Write full schema to `packages/db/prisma/schema.prisma`
- [ ] Add `"postinstall": "prisma generate"` to `packages/db/package.json` — ensures types exist before agents compile
- [ ] `prisma migrate dev --name init` — clean migration
- [ ] Export typed client from `packages/db/src/index.ts`: `export { PrismaClient } from '@prisma/client'`
- [ ] Seed script `packages/db/prisma/seed.ts`: one Profile, one DiscoveryPrefs, one ResumePrefs, three sample Jobs
- [ ] Unit tests: create/read/update/delete for each of the five models
- [ ] Add `prisma` to root `package.json` scripts: `"db:migrate": "pnpm -F db exec prisma migrate dev"`, `"db:seed": "pnpm -F db exec prisma db seed"`

### .claude configs to use
- **Skill:** `prisma-patterns` — schema design, avoid Prisma traps (updateMany count, @updatedAt on bulk writes, connection exhaustion on serverless, $transaction timeouts)
- **Skill:** `tdd-workflow` — write model tests before seeding
- **Agent:** `database-reviewer` — review schema for missing indexes, nullable traps, cascade rules

### Verification
```bash
pnpm db:migrate       # migration runs clean
pnpm db:seed          # seed inserts without error
pnpm -F db test       # all five model tests pass
pnpm typecheck        # agents package resolves Prisma types
```

### Exit criteria
All five models created. `prisma generate` wired into build. Seed populates dev.db. Unit tests cover all models. `packages/agents` compiles with DB types available.

---

## M2 — AG-UI Transport Layer

**Branch:** `milestone/m2-transport`
**Depends on:** M1

### Context brief
Before any agent can be implemented, the plumbing must exist. This milestone establishes: the RunAgentInput endpoint skeleton, SSE encoding via `@ag-ui/encoder`, the Claude-SSE → AG-UI event bridge, frontend `@ag-ui/client` setup, CORS config, RUN_ERROR handling, stream abort via AbortController, and the shared-state schema that all agents read and write. No agent logic yet — just the wire.

### What this milestone produces
```
packages/agents/src/
  shared/
    transport.ts          # Claude streaming → AG-UI event Observable
    state.ts              # AppState type: { jobs, profile, discoveryPrefs, resumePrefs }
    errors.ts             # RUN_ERROR emission, stream abort helpers
    base-agent.ts         # thin wrapper on AbstractAgent with error boundary + abort wiring

apps/web/
  app/
    api/agents/
      _lib/
        sse-handler.ts    # shared Next.js route handler: RunAgentInput → SSE response
        cors.ts           # CORS headers for agent endpoints
    providers/
      AgUIProvider.tsx    # @ag-ui/client HttpAgent + threadId from localStorage
```

### AG-UI shared-state schema
```typescript
type AppState = {
  jobs: Job[]             // full job list from DB
  profile: Profile | null
  discoveryPrefs: DiscoveryPrefs | null
  resumePrefs: ResumePrefs | null
}
```
Every `RunAgentInput.state` carries this shape. All agents read from it. `TrackerAgent` (M6) owns writes.

### Tasks
- [ ] `transport.ts`: async generator that consumes Anthropic stream events and emits typed AG-UI events
  - `anthropic.messages.stream()` → `TEXT_MESSAGE_START/CONTENT/END`
  - Claude tool_use blocks → `TOOL_CALL_START/ARGS/END/RESULT`
  - Stream errors → `RUN_ERROR`
  - AbortSignal wired through to Anthropic stream
- [ ] `state.ts`: `AppState` type + `loadAppState(db: PrismaClient): Promise<AppState>` helper
- [ ] `errors.ts`: `emitRunError(observer, message, code?)` helper; `wrapWithAbort(signal, observable)` helper
- [ ] `base-agent.ts`: extends `AbstractAgent`, adds error boundary around `run()`, wires `AbortController` to `RunAgentInput.signal`
- [ ] `sse-handler.ts`: Next.js route handler factory — validates `RunAgentInput` (Zod), instantiates agent, encodes observable as SSE, sets `Content-Type: text/event-stream`, handles client disconnect
- [ ] `cors.ts`: `Access-Control-Allow-Origin` restricted to `localhost:3000` in dev, configurable via env for prod
- [ ] `AgUIProvider.tsx`: wraps app with `@ag-ui/client` HttpAgent instance, exposes threadId from localStorage
- [ ] Integration test: stub agent emits `RUN_STARTED` → `TEXT_MESSAGE_CHUNK` → `RUN_FINISHED`, assert SSE stream decodes correctly on frontend

### .claude configs to use
- **Skill:** `agentic-engineering` — transport discipline, eval-first agent construction
- **Skill:** `api-design` — SSE endpoint shape, CORS config, error response format
- **Skill:** `error-handling` — stream abort, partial failure, RUN_ERROR patterns
- **Agent:** `typescript-reviewer` — review transport.ts and sse-handler.ts
- **Agent:** `security-reviewer` — review CORS configuration

### Verification
```bash
pnpm -F web dev
# POST /api/agents/_test with stub agent → SSE stream decodes in browser
# Disconnect mid-stream → AbortController fires, stream closes cleanly
# Bad RunAgentInput → 400 with validation error, no SSE opened
pnpm -F agents test   # transport unit tests pass
pnpm typecheck
```

### Exit criteria
SSE endpoint factory works end-to-end with a stub agent. CORS headers correct. RUN_ERROR emits on thrown exceptions. AbortController wired through to Claude stream. AppState type exported and used by all subsequent agents.

---

## M3 — App Shell + OrchestratorAgent + Chat Panel

**Branch:** `milestone/m3-shell-orchestrator`
**Depends on:** M2

### Context brief
The app shell establishes the two-panel layout (chat left, tabs right) and the tab router (Config / Results). OrchestratorAgent is the single chat endpoint — it reads AppState, classifies intent, and dispatches to the appropriate specialist agent internally. Other specialist agents are stubs at this point.

### Layout
```
┌──────────────────┬────────────────────────────────────────┐
│                  │  [⚙ Config]  [📊 Results]              │
│  ChatPanel       ├────────────────────────────────────────┤
│  (fixed 320px)   │                                        │
│                  │  active tab content (Config or Results) │
│                  │                                        │
└──────────────────┴────────────────────────────────────────┘
```

### OrchestratorAgent intent classification
Classifies input into one of: `evaluate` / `scan` / `generate-cv` / `update-config` / `query-tracker` / `general`. Routes to stub specialist agent or handles general directly.

### Tasks
- [ ] `apps/web/app/layout.tsx` — two-column shell, `AgUIProvider`, font loading
- [ ] `apps/web/app/components/shell/AppShell.tsx` — chat panel + tab panel layout
- [ ] `apps/web/app/components/shell/TabBar.tsx` — Config / Results tab switcher
- [ ] `apps/web/app/components/chat/ChatPanel.tsx`
  - Fixed left column, full height, scrollable message list
  - User and assistant message bubbles
  - Input field + send button + loading state
  - Streams TEXT_MESSAGE_CHUNK events into active assistant message
  - STEP_STARTED/FINISHED shown as inline step labels
  - RUN_ERROR shown as error message in chat
- [ ] `packages/agents/src/orchestrator/OrchestratorAgent.ts`
  - Extends `BaseAgent` from M2
  - System prompt: intent classification + routing instructions
  - Calls `loadAppState(db)` to inject full state into every run
  - Dispatches to stub specialist agents (no-op responses for now)
- [ ] `apps/web/app/api/agents/orchestrate/route.ts` — uses `sse-handler` from M2
- [ ] Tab state in URL: `?tab=config` / `?tab=results` (not localStorage — shareable/bookmarkable)
- [ ] Empty state: "What are you looking for today?" when chat history is empty

### .claude configs to use
- **Skill:** `react-patterns` — ChatPanel composition, controlled streaming text, message list
- **Skill:** `frontend-patterns` — shell layout, tab routing with URL state
- **Skill:** `design-system` — two-column layout, chat bubble styles, tab bar
- **Agent:** `react-reviewer` — accessibility of chat input, tab keyboard nav
- **Agent:** `typescript-reviewer` — OrchestratorAgent intent classification
- **Command:** `feature-dev`, `react-test`

### Verification
```bash
pnpm -F web dev
# Chat sends "hello" → streamed response appears
# Tab switching works, URL reflects active tab
# "evaluate a job" → OrchestratorAgent classifies as `evaluate`
# RUN_ERROR in chat displays gracefully
pnpm test
pnpm typecheck
```

### Exit criteria
Shell renders. Chat streams responses from OrchestratorAgent. Intent classification routes correctly to 6 categories. Tab switching works with URL sync. Error states display in chat.

---

## M4 — Config Tab UI

**Branch:** `milestone/m4-config-tab`
**Depends on:** M3

### Context brief
The Config tab fills in the right panel when `?tab=config`. Three collapsible sections. All fields inline-editable with debounced auto-save to DB via PATCH APIs. OrchestratorAgent (from M3) can also update config via the `update-config` intent path.

### Sections
- **Profile:** CV (markdown textarea), target roles (tag input), salary range, location, work type toggle
- **Discovery:** Portal checklist (grouped by ATS: Ashby, Greenhouse, Lever, Wellfound, Workable, RemoteFront), keywords, archetypes, min score
- **Resume:** Template radio (default / minimal / dense), section order drag-to-reorder, tone, emphasis keywords

### Tasks
- [ ] `apps/web/app/api/config/profile/route.ts` — GET + PATCH with Zod validation
- [ ] `apps/web/app/api/config/discovery/route.ts` — GET + PATCH
- [ ] `apps/web/app/api/config/resume/route.ts` — GET + PATCH
- [ ] `ConfigTab` component with `CollapsibleSection` wrapper
- [ ] `TagInput` component (reusable): add/remove string tags
- [ ] `PortalChecklist` component: 45 portals grouped by ATS platform
- [ ] `SectionOrderList` component: drag-to-reorder with native HTML5 drag
- [ ] Debounced save (500ms) with visual indicator ("Saving..." / "Saved")
- [ ] Optimistic updates: UI reflects change immediately, rolls back on API error
- [ ] OrchestratorAgent `update-config` path: parses intent, calls config PATCH API, emits confirmation

### .claude configs to use
- **Skill:** `react-patterns` — controlled inputs, optimistic updates, debounce hook
- **Skill:** `frontend-patterns` — compound component for collapsible sections
- **Skill:** `design-system` — form field styles, spacing hierarchy, save indicator
- **Agent:** `react-reviewer` — form accessibility (labels, ARIA, keyboard)
- **Command:** `react-test` — TDD for TagInput, PortalChecklist, debounced save

### Verification
```bash
pnpm -F web dev
# Fill out profile → changes persist on reload
# Toggle portals → selection persists
# Drag resume sections → order persists
# Chat: "add 'Staff Engineer' to target roles" → config updates, reflected in Config tab
pnpm test
pnpm typecheck
```

### Exit criteria
All three sections save to SQLite. Fields reload on refresh. Debounced save indicator works. Chat `update-config` path updates config. Zero accessibility violations on form inputs.

---

## M5 — EvaluationAgent + URL Paste

**Branch:** `milestone/m5-evaluation`
**Depends on:** M4
**Parallel with:** M6

### Context brief
EvaluationAgent is the core pipeline: take a job description (from a URL or pasted text), run 5 named steps using Claude, stream the 6-block report, and emit a STATE_DELTA patching the Job row on completion. URL paste in the Results tab creates a Job row and immediately triggers evaluation.

### EvaluationAgent event sequence
```
RUN_STARTED
  STEP_STARTED  { stepName: "archetype-detection" }
  STEP_FINISHED { stepName: "archetype-detection" }
  STEP_STARTED  { stepName: "scoring" }         ← A-F grade computed here
  STEP_FINISHED { stepName: "scoring" }
  STEP_STARTED  { stepName: "cv-match" }
  STEP_FINISHED { stepName: "cv-match" }
  STEP_STARTED  { stepName: "compensation-research" }
  STEP_FINISHED { stepName: "compensation-research" }
  STEP_STARTED  { stepName: "report-generation" }
    TEXT_MESSAGE_CHUNK × N  (streaming 6-block report)
  STEP_FINISHED { stepName: "report-generation" }
  STATE_DELTA   [RFC 6902: patch Job row — score, archetype, cvMatchPct, evalReport, status: "reviewed"]
RUN_FINISHED { outcome: { type: "interrupt", interrupts: [{ id, reason: "confirm-add-to-tracker" }] } }
```

### Tasks
- [ ] `packages/agents/src/evaluation/EvaluationAgent.ts`
  - System prompt: port career-ops evaluation rubric (10 weighted dimensions, A-F scoring)
  - Step 1: detect archetype (LLMOps / Agentic / PM / SA / FDE / Transformation)
  - Step 2: score against rubric + user profile scoring weights
  - Step 3: CV match analysis + percentage
  - Step 4: compensation research via Claude web search tool
  - Step 5: stream 6-block report (role summary, CV match, level strategy, compensation, personalization, interview prep)
  - Emit `STATE_DELTA` with RFC 6902 `replace` ops on job fields
  - Emit `interrupt` on `RUN_FINISHED`
- [ ] `apps/web/app/api/agents/evaluate/route.ts`
- [ ] URL paste input bar (top of Results tab stub — full table in M6)
  - Text field: paste URL or job description text
  - On submit: POST to `/api/jobs` to create Job row → POST to `/api/agents/evaluate`
  - Shows inline evaluation progress (step names) below the input while running
- [ ] `apps/web/app/api/jobs/route.ts` — POST creates Job row, GET returns all jobs
- [ ] Interrupt handler: toast "Evaluation complete — add to tracker?" → confirm/dismiss
- [ ] Wire `update-config` path in OrchestratorAgent to also trigger evaluation via `evaluate` intent

### .claude configs to use
- **Skill:** `agentic-engineering` — eval-first step construction, streaming agent discipline
- **Skill:** `tdd-workflow` — write prompt evals before implementation (test scoring on 5 sample JDs)
- **Agent:** `typescript-reviewer` — review EvaluationAgent step logic
- **Agent:** `code-reviewer` — review interrupt/resume flow

### Verification
```bash
pnpm -F web dev
# Paste a real job URL → Job created in DB → evaluation starts
# All 5 steps appear sequentially
# Report streams in
# STATE_DELTA patches job fields
# Interrupt fires → confirm → status updates
pnpm -F agents test   # EvaluationAgent unit tests including prompt evals
pnpm typecheck
```

### Exit criteria
URL paste creates a Job row and triggers evaluation. All 5 steps emit correctly. Score and report write to DB. Interrupt fires and resolves. Prompt evals pass on 5 sample JDs.

---

## M6 — Results Table + TrackerAgent

**Branch:** `milestone/m6-results-table`
**Depends on:** M4
**Parallel with:** M5

### Context brief
The Results table is the main surface of the app. TrackerAgent owns STATE_SNAPSHOT on load and STATE_DELTA for all mutations. This milestone ships the table shell, TrackerAgent, and the wiring so that EvaluationAgent events (from M5) update rows live once M5 is merged.

### Table columns
| ☐ | Company | Role | Source | Archetype | Score | Eval Status | Resume | Actions |

### TrackerAgent event sequence
```
RUN_STARTED
  STATE_SNAPSHOT { snapshot: AppState }   ← loads full job list from DB
RUN_FINISHED
```
For mutations (tool calls from frontend):
```
RUN_STARTED
  TOOL_CALL_START/ARGS/END/RESULT  (updateStatus / archiveJob / deleteJob / updateNotes)
  STATE_DELTA [RFC 6902 patch on jobs array]
RUN_FINISHED
```

### Tasks
- [ ] `packages/agents/src/tracker/TrackerAgent.ts`
  - `run()` with `STATE_SNAPSHOT` on every call
  - Frontend tools: `updateStatus(jobId, status)`, `archiveJob(jobId)`, `deleteJob(jobId)`, `updateNotes(jobId, notes)`
  - Each tool call writes to DB then emits `STATE_DELTA`
- [ ] `apps/web/app/api/agents/tracker/route.ts`
- [ ] `ResultsTab` component
  - Loads STATE_SNAPSHOT from TrackerAgent on mount
  - Applies STATE_DELTA patches (using `fast-json-patch`) to local job list state
  - Accepts live EvaluationAgent `STATE_DELTA` patches (same patch mechanism, different source)
- [ ] `JobTable` component
  - Columns: checkbox, company, role, source badge, archetype chip, score badge, eval status cell, resume cell, actions menu
  - `EvalStatusCell`: "New" / active step name (from STEP events) / grade badge
  - `ResumeCell`: locked (—) until eval done, then "Generate" button (M9), then download icon
  - Row checkbox: multi-select for batch (M8)
  - Action menu: Archive, Delete
- [ ] "Show archived" toggle in toolbar (filters table by status !== 'archived')
- [ ] Empty state: "Paste a job URL above or scan portals to get started"
- [ ] Toolbar: `[+ Paste URL]  [🔍 Scan]  [▶ Evaluate Selected (N)]  [📄 Generate Resume]` — Scan and batch buttons wired in M7/M8

### .claude configs to use
- **Skill:** `react-patterns` — table composition, STATE_SNAPSHOT → local state, patch application
- **Skill:** `frontend-patterns` — toolbar layout, action menu, badge components
- **Skill:** `react-performance` — memoize row components to prevent full-table re-renders on each DELTA
- **Agent:** `react-reviewer` — table accessibility (ARIA grid, keyboard nav, checkbox group)
- **Command:** `react-test`

### Verification
```bash
pnpm -F web dev
# Results tab loads → STATE_SNAPSHOT populates table with seeded jobs
# Merge M5 → URL paste creates row, evaluation steps appear live on that row
# Archive a job → row disappears, reappears with "Show archived"
# Delete a job → row removed from DB
pnpm test
pnpm typecheck
```

### Exit criteria
TrackerAgent STATE_SNAPSHOT loads table on mount. Mutations (archive, delete, notes, status) write via tool calls and reflect via STATE_DELTA. Table re-renders only changed rows on patch. Empty state correct.

---

## M7 — ScannerAgent

**Branch:** `milestone/m7-scanner`
**Depends on:** M5 + M6 merged
**Parallel with:** M8, M9, M10

### Context brief
ScannerAgent hits the 45+ portal APIs from career-ops, deduplicates against existing job URLs, and streams live progress as ACTIVITY events. Ends with an interrupt presenting new listings for the user to select for evaluation.

### ScannerAgent event sequence
```
RUN_STARTED
  ACTIVITY_SNAPSHOT { activityType: "SCAN_PROGRESS", content: { total: 45, done: 0, found: 0 } }
  [per portal batch]:
    STEP_STARTED  { stepName: "scanning-<platform>" }
    ACTIVITY_DELTA [patch: /done +=1, /found +=N ]
    STEP_FINISHED { stepName: "scanning-<platform>" }
  STATE_DELTA [add new Job rows: source: "scan", status: "new"]
RUN_FINISHED {
  outcome: {
    type: "interrupt",
    interrupts: [{ id, reason: "select-jobs-to-evaluate", responseSchema: { jobIds: string[] } }]
  }
}
```

### Tasks
- [ ] `packages/agents/src/scanner/ScannerAgent.ts`
  - Port portal configs from career-ops `portals.yml`
  - Implement API clients for Ashby, Greenhouse, Lever, Wellfound, Workable, RemoteFront
  - Deduplicate by URL against existing `Job.url` records in DB
  - Emit `ACTIVITY_DELTA` per portal batch (RFC 6902 `/done` and `/found` increments)
  - Batch-insert new jobs via Prisma `createMany`, then emit single `STATE_DELTA`
  - Inject DiscoveryPrefs from `RunAgentInput.state` to filter by keyword/archetype
- [ ] `apps/web/app/api/agents/scan/route.ts`
- [ ] "Scan Portals" button in Results table toolbar → opens `ScanProgressPanel`
- [ ] `ScanProgressPanel` component: renders ACTIVITY events as a live progress bar + portal list (done/total, found count)
- [ ] Interrupt handler: modal with found jobs table (company, role, url) + multi-select checkboxes → "Evaluate Selected" → fires BatchAgent (M8) with selected jobIds

### .claude configs to use
- **Skill:** `agentic-engineering` — ACTIVITY event patterns, interrupt/resume with structured response schema
- **Skill:** `api-design` — external portal API integration, error handling for down portals
- **Skill:** `error-handling` — partial scan failure (one portal down shouldn't abort all)
- **Agent:** `typescript-reviewer` — review ScannerAgent
- **Agent:** `security-reviewer` — SSRF risk review on portal URLs (portals are config-defined, not user-input, but validate anyway)

### Verification
```bash
pnpm -F web dev
# Click "Scan Portals" → progress panel shows platforms being hit
# New job rows appear in Results table via STATE_DELTA
# Interrupt fires → modal shows new listings → select 3 → queued for evaluation
pnpm test
pnpm typecheck
```

### Exit criteria
Scan hits at least 3 ATS platforms. ACTIVITY events render live progress. Deduplication prevents duplicate rows. Interrupt presents selectable job list.

---

## M8 — BatchAgent

**Branch:** `milestone/m8-batch`
**Depends on:** M5 + M6 merged
**Parallel with:** M7, M9, M10

### Context brief
BatchAgent runs multiple EvaluationAgent instances concurrently and multiplexes their event streams back to the UI. Each job's events are wrapped in a CUSTOM envelope tagged with jobId so the Results table can route step events to the correct row.

### BatchAgent event sequence
```
RUN_STARTED
  STEP_STARTED { stepName: "batch-init" }
  [for each job, concurrently up to BATCH_CONCURRENCY]:
    CUSTOM { name: "job-eval-started",   value: { jobId } }
    CUSTOM { name: "job-step-started",   value: { jobId, stepName } }
    CUSTOM { name: "job-step-finished",  value: { jobId, stepName } }
    STATE_DELTA  [patch job row for this jobId]
    CUSTOM { name: "job-eval-finished",  value: { jobId, score } }
  STEP_FINISHED { stepName: "batch-init" }
RUN_FINISHED
```

### Tasks
- [ ] `packages/agents/src/batch/BatchAgent.ts`
  - Accepts `jobIds: string[]` in `RunAgentInput.state.batchJobIds`
  - Concurrency semaphore: max `parseInt(process.env.BATCH_CONCURRENCY ?? '5')` parallel
  - Wraps each EvaluationAgent's events in `CUSTOM` envelope
  - Each job emits its own `STATE_DELTA` when done
- [ ] `apps/web/app/api/agents/batch/route.ts`
- [ ] Multi-select UI in Results table: checkbox column → "Evaluate Selected (N)" button in toolbar
- [ ] `EvalStatusCell` update: parse `CUSTOM` events keyed by jobId, show active step per row
- [ ] Concurrency indicator: "Evaluating 3 of 5 jobs..." in toolbar during batch
- [ ] `BATCH_CONCURRENCY` env var in `.env.example` with comment

### .claude configs to use
- **Skill:** `agentic-engineering` — concurrent agent spawning, semaphore pattern, CUSTOM event envelope
- **Skill:** `react-performance` — N concurrent live-updating rows without re-render churn (per-row memoization from M6 pays off here)
- **Agent:** `typescript-reviewer` — review concurrency semaphore logic
- **Agent:** `performance-optimizer` — table re-render behavior under batch load

### Verification
```bash
pnpm -F web dev
# Select 5 rows → "Evaluate Selected (5)" → all 5 rows show concurrent step progress
# Each row updates independently
# All 5 results write to DB
# UI stays responsive (no jank) during batch
pnpm test
pnpm typecheck
```

### Exit criteria
5 concurrent evaluations run without blocking. Per-row step indicators update independently. All results persisted. Semaphore respected. BATCH_CONCURRENCY env var works.

---

## M9 — CVAgent + Resume Generation

**Branch:** `milestone/m9-cv-agent`
**Depends on:** M5 + M6 merged
**Parallel with:** M7, M8, M10

### Context brief
CVAgent takes an evaluated Job + user profile + resume prefs and produces an ATS-optimized PDF. Playwright renders the HTML template to PDF server-side. The Resume cell in the Results table updates with a download link on completion.

### CVAgent event sequence
```
RUN_STARTED
  STEP_STARTED  { stepName: "keyword-injection" }
  STEP_FINISHED { stepName: "keyword-injection" }
  STEP_STARTED  { stepName: "template-render" }
  STEP_FINISHED { stepName: "template-render" }
  STEP_STARTED  { stepName: "pdf-generation" }
  STEP_FINISHED { stepName: "pdf-generation" }
  STATE_DELTA   [patch Job row: no change / patch GeneratedResume insert]
  CUSTOM        { name: "pdf-ready", value: { jobId, downloadUrl, filename } }
RUN_FINISHED
```

### Tasks
- [ ] Port `cv-template.html` from career-ops to `packages/agents/src/cv/template.html` (Space Grotesk + DM Sans design preserved)
- [ ] `packages/agents/src/cv/CVAgent.ts`
  - Keyword injection: Claude API call with JD keywords + profile CV → injected CV markdown
  - Template render: inject CV markdown into HTML template via string interpolation
  - Playwright PDF: `chromium.launch()` → `page.setContent()` → `page.pdf({ format: 'A4' })`
  - Save PDF to `apps/web/public/resumes/<jobId>-<timestamp>.pdf`
  - Create `GeneratedResume` record in DB
  - Emit `STATE_DELTA` adding resume to job's `resumes` relation
  - Emit `CUSTOM` with download URL
- [ ] `apps/web/app/api/agents/cv/route.ts`
- [ ] `apps/web/app/api/resumes/[id]/route.ts` — serves PDF file (validates jobId ownership)
- [ ] `ResumeCell` update: "Generate" button → triggers CVAgent → progress shows 3 steps → download icon when done
- [ ] `playwright install chromium` in `setup.sh` (added in M12, documented here)
- [ ] `.env.example` addition: `RESUME_OUTPUT_DIR=apps/web/public/resumes`

### .claude configs to use
- **Skill:** `agentic-engineering` — multi-step agent with file-system side effect
- **Skill:** `error-handling` — Playwright timeout, Chromium not installed, file write failure
- **Agent:** `typescript-reviewer` — review CVAgent
- **Agent:** `security-reviewer` — file path handling (path traversal on `[id]` route)

### Verification
```bash
pnpm -F web dev
# Click "Generate Resume" on an evaluated job → 3 steps visible on Resume cell
# PDF appears in public/resumes/
# Download link appears → opens valid PDF
# GeneratedResume record in DB
pnpm test
pnpm typecheck
```

### Exit criteria
PDF generates for an evaluated job. File served via download route. DB record created. Resume cell updates via CUSTOM event + STATE_DELTA. Path traversal test passes.

---

## M10 — Row Expand + Inline Edit

**Branch:** `milestone/m10-row-expand`
**Depends on:** M5 + M6 merged (NOT M9 — resume block is additive)
**Parallel with:** M7, M8, M9

### Context brief
Click any row in the Results table → it expands to reveal the 6-block evaluation report and editable fields. Status dropdown and notes field write via TrackerAgent tool calls. Resume preview appears if M9 has run. Keyboard accessible.

### Expanded row layout
```
▼ Anthropic — Staff Engineer [A] [✓ Evaluated] [⬇ Resume]
  ╔══════════════════════════════════════════════════════╗
  ║  Role Summary        │  CV Match (87%)              ║
  ║  ─────────────────   │  ───────────────────────     ║
  ║  [content]           │  [content]                   ║
  ║                      │                              ║
  ║  Level Strategy      │  Compensation                ║
  ║  ─────────────────   │  ───────────────────────     ║
  ║  [content]           │  [content]                   ║
  ║                      │                              ║
  ║  Personalization     │  Interview Prep              ║
  ║  ─────────────────   │  ───────────────────────     ║
  ║  [content]           │  [content]                   ║
  ╚══════════════════════════════════════════════════════╝
  Status: [Reviewed ▾]   Notes: [click to edit inline]   [Archive]
  Resume: [PDF preview if M9 done]  [⬇ Download]
```

### Tasks
- [ ] `ExpandedJobRow` component — inline expand below row, not modal
- [ ] `EvalReportRenderer`: parse `evalReport` JSON, render 6 named blocks in 2-column grid
- [ ] `StatusDropdown`: new → reviewed → applying → applied → archived — fires TrackerAgent `updateStatus` tool call on change
- [ ] `InlineNotesField`: click to edit, blur to save — fires TrackerAgent `updateNotes` tool call
- [ ] `ResumeMiniPreview`: `<iframe src="/api/resumes/[id]">` — conditional on `job.resumes.length > 0`
- [ ] Expand/collapse animation: `max-height` CSS transition on compositor, no layout jump
- [ ] Keyboard: `Enter` or `Space` on row toggles expand, `Escape` collapses
- [ ] `aria-expanded`, `aria-controls` on row, `role="region"` on expanded panel

### .claude configs to use
- **Skill:** `react-patterns` — compound component, optimistic tool-call updates
- **Skill:** `frontend-patterns` — inline edit UX, expand animation
- **Skill:** `design-system` — report block hierarchy, 2-column grid, type scale
- **Agent:** `react-reviewer` — ARIA correctness, keyboard navigation
- **Agent:** `performance-optimizer` — `max-height` animation on compositor only

### Verification
```bash
pnpm -F web dev
# Click row → expands showing all 6 report blocks
# Change status → DB updates, badge reflects new status
# Edit notes → saves on blur
# Collapse → smooth animation
# Keyboard: Enter toggles, Escape collapses
# Merge M9 → Resume preview visible for jobs with generated PDFs
pnpm test
pnpm typecheck
```

### Exit criteria
All 6 report blocks render. Status and notes save via TrackerAgent tool calls. Expand/collapse keyboard accessible with correct ARIA. PDF preview conditional on resume existence.

---

## M11 — Security Hardening

**Branch:** `milestone/m11-security`
**Depends on:** M10

### Context brief
Full security pass before public release. Covers CSP headers, input validation on all routes, rate limiting on agent endpoints, and path traversal hardening on the resume download route.

### Tasks
- [ ] **CSP**: nonce-based policy in `next.config.ts` middleware — `script-src 'self' 'nonce-{RANDOM}'`, `object-src 'none'`, `frame-ancestors 'none'`
- [ ] **Security headers**: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [ ] **Zod validation** on all API routes: `/api/agents/*`, `/api/config/*`, `/api/jobs`, `/api/resumes/*`
- [ ] **Path traversal guard** on `/api/resumes/[id]`: resolve path, assert it stays within `RESUME_OUTPUT_DIR`
- [ ] **Rate limiting** on agent endpoints: simple in-memory token bucket (10 req/min per IP), configurable via env
- [ ] **CORS production config**: `ALLOWED_ORIGIN` env var replaces localhost hardcode from M2
- [ ] **`ANTHROPIC_API_KEY` validation** at startup: fail fast with clear error if missing
- [ ] Input length caps on all text fields (CV max 50k chars, notes max 2k, etc.)
- [ ] No secrets in client bundle: audit with `next build` + bundle analyzer

### .claude configs to use
- **Skill:** `security-review` — full security audit checklist
- **Agent:** `security-reviewer` — review CSP policy, rate limit implementation, path traversal guard
- **Command:** `security-scan`

### Verification
```bash
curl -I http://localhost:3000 | grep -E "Content-Security|Strict-Transport|X-Frame|X-Content"
# All 5 headers present

# Path traversal test
curl http://localhost:3000/api/resumes/../../../.env  # → 400

# Rate limit test
for i in $(seq 1 15); do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/agents/orchestrate; done
# → 429 after 10

pnpm typecheck && pnpm lint
```

### Exit criteria
All 5 security headers set. Zod validation on all routes. Path traversal blocked. Rate limiter fires at threshold. No API keys in client bundle. Startup fails with clear message if `ANTHROPIC_API_KEY` is missing.

---

## M12 — Performance + Open Source Packaging

**Branch:** `milestone/m12-polish-oss`
**Depends on:** M10 (can run in parallel with M11)

### Context brief
Performance audit and open source packaging. The goal: a stranger can `git clone` + `ANTHROPIC_API_KEY=xxx ./setup.sh` and have a running app in under 5 minutes. Includes Playwright browser install, DB bootstrap, and Lighthouse targets.

### Performance tasks
- [ ] Lighthouse audit: LCP < 2.5s, CLS < 0.1, TBT < 200ms, FCP < 1.5s
- [ ] Initial JS bundle < 150kb gzipped — `next build` + bundle analyzer
- [ ] Table virtualization: use `@tanstack/react-virtual` if row count > 100
- [ ] Memoize `JobRow` component: `React.memo` + stable `onExpand` callback ref
- [ ] Error boundaries: wrap `ChatPanel` and `ResultsTab` with React error boundaries
- [ ] Empty states: `ResultsTab` empty state, `ConfigTab` empty state
- [ ] Toast system for `RUN_ERROR` events (lightweight, no external dep)
- [ ] Loading skeletons for `STATE_SNAPSHOT` initial load

### Open source packaging tasks
- [ ] `README.md`:
  - What it is (3 sentences)
  - Prerequisites: Node 20+, pnpm 9+, Anthropic API key
  - Quickstart (5 numbered steps: clone → install → env → setup → open)
  - Architecture overview diagram (ASCII)
  - Contributing link
- [ ] `setup.sh`:
  ```bash
  #!/bin/bash
  pnpm install
  pnpm db:migrate
  pnpm db:seed
  npx playwright install chromium    # ← critical for CVAgent
  pnpm dev
  ```
- [ ] `CONTRIBUTING.md`: dev setup, agent architecture overview, PR conventions, how to add a portal
- [ ] `LICENSE`: MIT
- [ ] `.env.example` (final version): all env vars with inline comments
- [ ] **Agent architecture audit** using `agent-architecture-audit` skill: run 12-layer audit on all 6 agents before tagging v0.1.0

### .claude configs to use
- **Skill:** `react-performance` — LCP, bundle, re-render audit
- **Skill:** `agent-architecture-audit` — 12-layer pre-release audit on all agents
- **Skill:** `opensource-pipeline` — README, CONTRIBUTING, LICENSE, setup.sh generation
- **Agent:** `performance-optimizer` — sign off on Lighthouse targets
- **Agent:** `opensource-packager` — review and finalize open source docs
- **Command:** `quality-gate`, `update-docs`

### Verification
```bash
# Clone test (most important)
git clone https://github.com/eddie-nv/tailored /tmp/tailored-test
cd /tmp/tailored-test
cp .env.example .env && echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env
./setup.sh
# → app starts at localhost:3000 within 5 minutes, first eval works

# Lighthouse
pnpm lighthouse http://localhost:3000  # all CWV pass

# Build
pnpm build  # production build succeeds, no warnings

pnpm test   # full suite green
pnpm typecheck && pnpm lint
```

### Exit criteria
Clone-to-running in under 5 minutes from scratch (including Playwright Chromium download). Lighthouse passes all CWV targets. Full test suite green. Production build succeeds. Agent architecture audit passes (no P0 findings). v0.1.0 tag ready.

---

## Summary table

| # | Milestone | Branch | Key deliverable | .claude skills | Parallel with |
|---|-----------|--------|-----------------|----------------|---------------|
| M0 | Scaffold | `milestone/m0-scaffold` | pnpm workspace, 3 packages, base deps | `nextjs-turbopack`, `coding-standards` | — |
| M1 | Database | `milestone/m1-database` | Prisma schema, migrations, seed, build graph | `prisma-patterns`, `tdd-workflow` | — |
| M2 | Transport | `milestone/m2-transport` | AG-UI SSE plumbing, CORS, RUN_ERROR, AppState type | `agentic-engineering`, `api-design`, `error-handling` | — |
| M3 | Shell + Orchestrator | `milestone/m3-shell-orchestrator` | App shell, OrchestratorAgent, chat panel | `react-patterns`, `frontend-patterns`, `design-system` | — |
| M4 | Config Tab | `milestone/m4-config-tab` | Config tab UI, 3 PATCH APIs, inline-edit | `react-patterns`, `frontend-patterns`, `design-system` | — |
| M5 | Evaluation | `milestone/m5-evaluation` | EvaluationAgent (5 steps), URL paste entry | `agentic-engineering`, `tdd-workflow` | M6 |
| M6 | Results Table | `milestone/m6-results-table` | Pipeline table, TrackerAgent, STATE_SNAPSHOT/DELTA | `react-patterns`, `react-performance` | M5 |
| M7 | Scanner | `milestone/m7-scanner` | ScannerAgent, ACTIVITY events, portal scan | `agentic-engineering`, `api-design`, `error-handling` | M8, M9, M10 |
| M8 | Batch | `milestone/m8-batch` | BatchAgent, parallel eval, per-row progress | `agentic-engineering`, `react-performance` | M7, M9, M10 |
| M9 | CV Agent | `milestone/m9-cv-agent` | CVAgent, Playwright PDF, resume column | `agentic-engineering`, `error-handling` | M7, M8, M10 |
| M10 | Row Expand | `milestone/m10-row-expand` | Expand row, 6-block report, inline edit | `react-patterns`, `design-system` | M7, M8, M9 |
| M11 | Security | `milestone/m11-security` | CSP, rate limit, Zod validation, path guard | `security-review` | M12 |
| M12 | Perf + OSS | `milestone/m12-polish-oss` | Lighthouse pass, setup.sh, README, agent audit | `react-performance`, `agent-architecture-audit`, `opensource-pipeline` | M11 |

**13 milestones. 4 parallel windows. Single-user MVP ships at end of M12.**
