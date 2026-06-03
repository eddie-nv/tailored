# Plan: Phase 3 Accessibility Fixes

**Complexity:** Medium
**WCAG target:** 2.2 AA (extending Phase 2 coverage)
**Scope:** 15 issues, ~15 files, 0 new npm packages
**All files under:** `apps/web/app/`

## Context

Phase 3 of the accessibility transition. Phases 1 (audit) and 2 (14 WCAG fixes, 12 files) are complete and merged.
Baseline is clean: build PASS, typecheck PASS, lint PASS (5 pre-existing warnings, none a11y-related).

The auto-hooks `post:quality-gate` and `stop:format-typecheck` run on every edit automatically.
Do NOT modify linter/formatter config files — `pre:config-protection` will block it.

---

## Config & Tooling

### Hooks Active During Phase 3

These fire automatically and require no explicit calls per task:

| Hook | When | What It Does |
|---|---|---|
| `post:quality-gate` | After every Edit/Write/MultiEdit | Runs format + lint + typecheck on changed file |
| `stop:format-typecheck` | After each response | Batch Prettier/Biome + `tsc --noEmit` on all files edited this response |
| `stop:check-console-log` | After each response | Flags any `console.log` in modified files |
| `pre:config-protection` | Before Edit/Write on config files | **Blocks** edits to `eslint.config.mjs`, `tsconfig.json`, etc. |
| `post:edit:design-quality-check` | After Edit/Write/MultiEdit | Warns if frontend edits drift toward generic template-looking UI |

### ESLint jsx-a11y Status

`eslint-config-next/core-web-vitals` is active (`apps/web/eslint.config.mjs`).
It includes a subset of jsx-a11y rules. What IS enforced:

- `jsx-a11y/alt-text` ✅
- `jsx-a11y/aria-props` ✅
- `jsx-a11y/aria-proptypes` ✅
- `jsx-a11y/aria-unsupported-elements` ✅
- `jsx-a11y/role-has-required-aria-props` ✅
- `jsx-a11y/role-supports-aria-props` ✅

What is NOT enforced (gaps relevant to Phase 3):

- `jsx-a11y/label-has-associated-control` ❌ — would catch H-B, H-H, M-D
- `jsx-a11y/click-events-have-key-events` ❌ — would catch mouse-only handlers
- `jsx-a11y/no-static-element-interactions` ❌
- `jsx-a11y/no-noninteractive-element-interactions` ❌

### ESLint Config Extension (Pre-Phase Step — requires user action)

`eslint.config.mjs` is config-protected. To enable the missing rules,
the user must manually add this block before execution begins:

```js
// apps/web/eslint.config.mjs — add after existing spreads
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { "jsx-a11y": jsxA11y },
    rules: {
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
    },
  },
  globalIgnores([...]),
]);
```

`eslint-plugin-jsx-a11y` is already in `devDependencies` — no `pnpm add` needed.
After adding, run `pnpm lint` once to confirm 0 new errors (fixes in Phase 3 will eliminate any
warnings these rules surface).

### Validation Commands (same as Phase 2)

```bash
pnpm typecheck   # 0 errors
pnpm lint        # 0 errors, ≤ 5 pre-existing warnings
pnpm build       # clean production build
```

---

## Issues Being Fixed

### HIGH — Screen reader barriers (8 issues)

| ID | File | Issue | WCAG |
|---|---|---|---|
| H-A | `chat/ChatPanel.tsx` | `role="log"` missing explicit `aria-live="polite"` + `aria-label` | 4.1.3 |
| H-B | `config/TagInput.tsx` | Input lacks `aria-label`; no `aria-describedby` for usage instructions | 1.3.1, 3.3.2 |
| H-C | `results/ResumeCell.tsx` | Step status changes (pending→active→done) have no live region announcement | 4.1.3 |
| H-D | `results/InlineNotesField.tsx` | Enter/exit edit mode not announced; no hint for save/cancel keys | 4.1.3, 3.3.2 |
| H-E | `results/EvalReportRenderer.tsx` | Report data in CSS grid `<div>`s — no semantic structure | 1.3.1 |
| H-F | `results/ScanProgressPanel.tsx` | Progress indicators visual-only — missing `role="progressbar"` + `aria-value*` | 4.1.2 |
| H-G | `results/EvalStatusCell.tsx` | Score badge (letter grade) has no scale context for AT users | 1.3.1 |
| H-H | `config/ProfileSection.tsx` | Multi-field form audit — inputs may lack `htmlFor`/id wiring | 1.3.1, 3.3.2 |

### MEDIUM — Usability gaps (7 issues)

| ID | File | Issue | WCAG |
|---|---|---|---|
| M-A | `chat/ChatInput.tsx` | Keyboard hint not linked to textarea via `aria-describedby` | 3.3.2 |
| M-B | `config/PortalChecklist.tsx` | Checkbox group lacks `<fieldset>` + `<legend>` | 1.3.1 |
| M-C | `config/SaveIndicator.tsx` | Save state conveyed by color/icon only — no screen-reader text | 1.4.1 |
| M-D | `results/UrlPasteBar.tsx` | URL input missing accessible label | 1.3.1 |
| M-E | `results/ResultsToolbar.tsx` | Filter/sort controls may lack descriptive labels | 1.3.1 |
| M-F | `results/ResumeMiniPreview.tsx` | PDF thumbnail likely missing meaningful `alt` text | 1.1.1 |
| M-G | `config/DiscoverySection.tsx` | Filter options need label/grouping audit | 1.3.1 |

---

## Patterns to Mirror

| Pattern | Source file | Detail |
|---|---|---|
| `useId()` for ARIA wiring | `config/CollapsibleSection.tsx` | Already used — same import for label↔control pairing |
| `role="status"` live region | `config/SectionOrderList.tsx:28-44` | Visually hidden div via ref for announcements |
| `sr-only` for screen-reader text | `shell/AppShell.tsx` | Tailwind `sr-only` for skip link |
| `aria-live="polite"` | `results/InterruptToast.tsx` | Implicit via `role="alert"` — use explicit for log/status |
| `inert` for hidden focusable content | `results/ExpandedJobRow.tsx` | React 19 `inert={!active ? '' : undefined}` |

---

## Files to Change (~15 total)

| File | Action | Tasks |
|---|---|---|
| `chat/ChatPanel.tsx` | UPDATE | Task 1 (H-A) |
| `chat/ChatInput.tsx` | UPDATE | Task 2 (M-A) |
| `config/TagInput.tsx` | UPDATE | Task 3 (H-B) |
| `config/ProfileSection.tsx` | UPDATE | Task 4 (H-H) |
| `config/PortalChecklist.tsx` | UPDATE | Task 5 (M-B) |
| `config/SaveIndicator.tsx` | UPDATE | Task 6 (M-C) |
| `config/DiscoverySection.tsx` | UPDATE | Task 7 (M-G) |
| `results/ResumeCell.tsx` | UPDATE | Task 8 (H-C) |
| `results/InlineNotesField.tsx` | UPDATE | Task 9 (H-D) |
| `results/EvalReportRenderer.tsx` | UPDATE | Task 10 (H-E) |
| `results/ScanProgressPanel.tsx` | UPDATE | Task 11 (H-F) |
| `results/EvalStatusCell.tsx` | UPDATE | Task 12 (H-G) |
| `results/UrlPasteBar.tsx` | UPDATE | Task 13 (M-D) |
| `results/ResultsToolbar.tsx` | UPDATE | Task 14 (M-E) |
| `results/ResumeMiniPreview.tsx` | UPDATE | Task 15 (M-F) |

---

## Execution Order

```
Step 0:  User manually extends eslint.config.mjs (config-protected — cannot be agent-edited)
         Then: pnpm lint to confirm clean baseline

Step 1:  Tasks 1, 2 in parallel — ChatPanel live region + ChatInput hint (chat/ only, no deps)

Step 2:  Tasks 3, 4, 5, 6, 7 in parallel — all config/ components (independent of each other)

Step 3:  Tasks 8, 9, 10, 11, 12 in parallel — results/ status/progress components (independent)

Step 4:  Tasks 13, 14, 15 in parallel — results/ form/toolbar/preview (independent)
```

---

## Task Detail

### Task 1 — `ChatPanel` (H-A)
**File:** `apps/web/app/components/chat/ChatPanel.tsx`

- Find the scrollable messages container that has `role="log"`
- Add `aria-live="polite"` explicitly (role="log" implies it but not all AT honor the implicit value)
- Add `aria-label="Chat messages"` to the same element
- Add `aria-atomic="false"` so AT reads only new additions, not the full log

Validate: `pnpm typecheck`

---

### Task 2 — `ChatInput` (M-A)
**File:** `apps/web/app/components/chat/ChatInput.tsx`

- Add `useId()` to the React import
- Add `const hintId = useId()`
- Add `id={hintId}` to the keyboard hint text element (the one with "Enter to send · Shift+Enter for newline")
- Add `aria-describedby={hintId}` to the `<textarea>`

Validate: `pnpm typecheck`

---

### Task 3 — `TagInput` (H-B)
**File:** `apps/web/app/components/config/TagInput.tsx`

- Add `useId()` to the React import
- Add `const descId = useId()`
- Add `id={descId}` to a visually-hidden instructions `<span>`:
  `<span id={descId} className="sr-only">Type a tag and press Enter, comma, or space to add it.</span>`
- Add `aria-describedby={descId}` to the `<input>` element
- Verify tag removal buttons already have descriptive `aria-label` (e.g. `aria-label={`Remove ${tag}`}`)
  — add if missing

Validate: `pnpm typecheck`

---

### Task 4 — `ProfileSection` (H-H)
**File:** `apps/web/app/components/config/ProfileSection.tsx`

- Audit every `<input>`, `<textarea>`, `<select>` in this file
- For each, verify it has either:
  a) `id` paired with a `<label htmlFor={id}>`, OR
  b) `aria-label` directly on the control
- Add `useId()` per field group where `htmlFor`/id pairing is missing
- Do NOT add `aria-label` to controls that already have a visible `<label htmlFor>` — that would duplicate the announcement

Validate: `pnpm typecheck`

---

### Task 5 — `PortalChecklist` (M-B)
**File:** `apps/web/app/components/config/PortalChecklist.tsx`

- Wrap the checkbox list in `<fieldset>` with `<legend>` naming the group
  (e.g. `<legend className="sr-only">Job portal selection</legend>` if no visible group heading exists,
  or a visible `<legend>` if the design supports it)
- Do not change any existing checkbox `id`/`label` wiring

Validate: `pnpm typecheck`

---

### Task 6 — `SaveIndicator` (M-C)
**File:** `apps/web/app/components/config/SaveIndicator.tsx`

- Add a `<span className="sr-only">` inside the component that renders:
  - `"Saving…"` when saving
  - `"Saved"` when done
  - `"Save failed"` on error
- Keep the visual icon/badge unchanged — this is additive only
- The parent should already have this component in a `role="status"` or `aria-live` container;
  if not, wrap the component output in `<span role="status" aria-live="polite">`

Validate: `pnpm typecheck`

---

### Task 7 — `DiscoverySection` (M-G)
**File:** `apps/web/app/components/config/DiscoverySection.tsx`

- Audit all interactive controls (inputs, selects, toggles, checkboxes)
- Ensure every control has an associated `<label>` or `aria-label`
- If filter options exist as a group, wrap them in `<fieldset>` + `<legend>`
- Apply same `useId()` pattern as Task 4 for any `htmlFor`/id wiring

Validate: `pnpm typecheck`

---

### Task 8 — `ResumeCell` (H-C)
**File:** `apps/web/app/components/results/ResumeCell.tsx`

- Add a visually-hidden live region `<div role="status" aria-live="polite" className="sr-only" ref={liveRef} />`
  using `useRef`
- When the active step changes, update `liveRef.current.textContent` to announce the step name:
  e.g. `"Generating resume: ${stepLabel}"`
- When generation completes, announce `"Resume ready for download"`
- Do not change any visual progress display

Validate: `pnpm typecheck`

---

### Task 9 — `InlineNotesField` (H-D)
**File:** `apps/web/app/components/results/InlineNotesField.tsx`

- Add `useId()` to the React import
- Add `const hintId = useId()`
- Add a visually-hidden `<span id={hintId} className="sr-only">` with:
  `"Press Ctrl+Enter to save, Escape to cancel."`
- Add `aria-describedby={hintId}` to the `<textarea>`
- On enter-edit transition, use a `role="status"` live region to announce `"Notes editing mode"`
  (can reuse existing pattern from SectionOrderList)

Validate: `pnpm typecheck`

---

### Task 10 — `EvalReportRenderer` (H-E)
**File:** `apps/web/app/components/results/EvalReportRenderer.tsx`

- Replace the CSS grid `<div className="grid grid-cols-2...">` structure with a `<dl>` (definition list)
- Each report block becomes:
  ```tsx
  <div>
    <dt className="...">Block title</dt>
    <dd className="...">Block content</dd>
  </div>
  ```
- A `<dl>` with child `<div>` wrappers (each containing one `<dt>` + one `<dd>`) is valid HTML
- Adjust CSS classes to maintain the same visual grid — Tailwind grid classes work on `<dl>`

Validate: `pnpm typecheck`

---

### Task 11 — `ScanProgressPanel` (H-F)
**File:** `apps/web/app/components/results/ScanProgressPanel.tsx`

- Find each progress bar element (likely a `<div>` with a dynamic width style)
- Add to the progress track container:
  ```tsx
  role="progressbar"
  aria-valuenow={Math.round(percentComplete)}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Scan progress"
  ```
- If there are multiple progress bars (one per portal), add a unique `aria-label` per bar:
  e.g. `aria-label={`${portalName} scan progress`}`

Validate: `pnpm typecheck`

---

### Task 12 — `EvalStatusCell` (H-G)
**File:** `apps/web/app/components/results/EvalStatusCell.tsx`

- Find the score badge element (displays letter grade A–F or numeric)
- Wrap in or replace with an element that has a descriptive `aria-label`:
  ```tsx
  <span aria-label={`Match score: ${score}`}>
    {score}
  </span>
  ```
- If a tooltip or title already explains the scale, link it via `aria-describedby` instead
- Do not remove the visible badge text

Validate: `pnpm typecheck`

---

### Task 13 — `UrlPasteBar` (M-D)
**File:** `apps/web/app/components/results/UrlPasteBar.tsx`

- Verify the URL `<input>` has a visible `<label>` or `aria-label`
- If no label exists: add `<label htmlFor={inputId}>Paste job URL</label>` (visible) using `useId()`
  OR add `aria-label="Paste job URL"` directly to the input if visual label is not desired
- Prefer visible label — it benefits all users, not just AT users

Validate: `pnpm typecheck`

---

### Task 14 — `ResultsToolbar` (M-E)
**File:** `apps/web/app/components/results/ResultsToolbar.tsx`

- Audit all `<button>`, `<select>`, `<input>` controls in the toolbar
- For icon-only buttons: add `aria-label` describing the action (e.g. `aria-label="Filter results"`)
- For select controls: verify `<label htmlFor>` or `aria-label` is present
- For toggle buttons: add `aria-pressed={isActive}` where appropriate

Validate: `pnpm typecheck`

---

### Task 15 — `ResumeMiniPreview` (M-F)
**File:** `apps/web/app/components/results/ResumeMiniPreview.tsx`

- Find the `<img>` or canvas element used for the PDF thumbnail
- If `<img>`: add `alt={`Resume preview for ${jobTitle}`}` using the job title prop
- If the thumbnail is purely decorative (content is downloadable/viewable elsewhere): use `alt=""`
- If it is a `<canvas>` or non-img element: add `aria-label` or wrap in a `<figure>` with `<figcaption>`

Validate: `pnpm typecheck`

---

## Final Validation

```bash
pnpm typecheck   # 0 errors
pnpm lint        # 0 errors, ≤ 5 pre-existing warnings
pnpm build       # clean production build
```

Then run `react-reviewer` agent and `typescript-reviewer` agent on the diff, then `/quality-gate --fix`.

---

## Risks

| Risk | Mitigation |
|---|---|
| `pre:config-protection` blocks `eslint.config.mjs` | User must add jsx-a11y rules manually in Step 0 |
| `EvalReportRenderer` grid → `<dl>` may break visual layout | Keep grid classes on `<dl>`; only the element type changes |
| `ScanProgressPanel` may use animated CSS width instead of a value | Read the component first; if value-less, use `aria-label` only (no `aria-valuenow`) |
| `ProfileSection` field audit may reveal many unlabeled inputs | Fix all found — they're all 1–2 line changes per field |
| Live region in `ResumeCell` may fire before mount | Use `useEffect` on step state; update `textContent` not `innerHTML` |
| `useId()` not imported in some files | Add alongside existing React imports; post:quality-gate hook will catch typecheck errors |

---

## Acceptance Criteria

- [ ] ESLint config extended with additional jsx-a11y rules (Step 0, manual)
- [ ] All 15 issues addressed
- [ ] `pnpm typecheck` passes (0 errors)
- [ ] `pnpm lint` passes (0 errors, ≤ 5 pre-existing warnings)
- [ ] `pnpm build` passes
- [ ] `react-reviewer` agent run on final diff — no CRITICAL or HIGH findings
- [ ] `typescript-reviewer` agent run on final diff — no CRITICAL or HIGH findings
- [ ] `/quality-gate --fix` passes
