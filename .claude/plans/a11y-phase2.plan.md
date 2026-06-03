# Plan: Phase 2 Accessibility Fixes

**Complexity:** Medium
**WCAG target:** 2.2 AA
**Scope:** 14 issues, 12 files, 0 new npm packages
**All files under:** `apps/web/app/`

## Context

This plan is Phase 2 of a 5-phase accessibility transition. Phase 1 (audit + baseline) is complete.
The baseline is clean: build PASS, typecheck PASS, lint PASS (5 pre-existing warnings, none a11y-related), 43 backend tests passing, zero frontend tests.

The auto-hooks `post:quality-gate` and `stop:format-typecheck` run on every edit automatically.
Do NOT modify linter/formatter config files.

---

## Issues Being Fixed

### CRITICAL (3)
| ID | File | Issue | WCAG |
|---|---|---|---|
| C1 | `results/ScanInterruptModal.tsx` | No focus trap, no initial focus, no restore on close | 2.4.3, 2.1.2 (A) |
| C2 | `results/InterruptToast.tsx` | `role="alertdialog"` with no focus management | 4.1.2, 1.3.1 (A) |
| C3 | `config/CollapsibleSection.tsx` | Toggle button missing `aria-controls`; panel missing `id` | 4.1.2 (A) |

### HIGH (10)
| ID | File | Issue | WCAG |
|---|---|---|---|
| H1 | `shell/AppShell.tsx` | `<main role="tabpanel">` overrides the `main` landmark; no tab↔panel wiring | 4.1.2, 1.3.1 (A) |
| H2 | `shell/TabBar.tsx` | All tabs `tabIndex={0}`; no roving tabindex; no arrow-key nav | 2.1.1 (A) |
| H3 | `config/SectionOrderList.tsx` | Drag-only reorder — no keyboard alternative at all | 2.1.1, 2.5.7 (AA) |
| H4 | `results/JobTable.tsx` | `ActionMenu`: focus stays on trigger on open; no arrow-key nav; no keyboard dismiss | 2.1.1, 4.1.2 (A) |
| H5 | `results/ExpandedJobRow.tsx` | Focusable controls inside `aria-hidden` container when collapsed | 4.1.2, 2.4.3 (A) |
| H7 | `chat/ChatMessage.tsx` | `role="article"` on every message bubble floods AT landmark/article tree | 4.1.2 (A) |
| H8 | `results/ScanInterruptModal.tsx` | `<tr onClick>` is mouse-only; no `tabIndex` or `onKeyDown` | 2.1.1 (A) |
| H9 | `results/StatusDropdown.tsx` | Visible `<label>` has no `htmlFor`; `<select>` has no `id` | 1.3.1, 3.3.2 (A) |
| H10 | `results/JobTable.tsx` | Source badge differentiates scan vs URL by near-identical color shades only | 1.4.1 (A) |
| H12 | `globals.css` | `@keyframes blink` runs infinite with no `prefers-reduced-motion` guard | 2.2.2 (A) |
| H13 | `results/JobTable.tsx` | `role="grid"` on `<table>` implies arrow-key cell nav which is not implemented | 4.1.2, 2.1.1 (A) |

### MEDIUM (1)
| ID | File | Issue | WCAG |
|---|---|---|---|
| M1 | `shell/AppShell.tsx` | No skip navigation link; no `<h1>` on the page | 2.4.1, 2.4.6 (A) |
| M5 | `results/ScanInterruptModal.tsx` | `<th>` cells missing `scope="col"` | 1.3.1 (A) |

---

## Patterns to Mirror

| Pattern | Source file | Detail |
|---|---|---|
| `useId()` | `results/ExpandedJobRow.tsx:3,31` | Already in use — same import for ARIA IDs |
| `useEffect` + event listener cleanup | `results/ScanInterruptModal.tsx:22-28` | Focus trap keyboard handler pattern |
| `useRef` + `.focus()` | `chat/ChatInput.tsx` | Imperative focus management |
| `useCallback` for handlers | Throughout codebase | All event handlers wrapped |
| Immutable splice for reorder | `config/SectionOrderList.tsx:47-49` | Already used in drag handler |
| Tailwind `sr-only` | Layout components | Visually hidden but AT-accessible content |

---

## Files to Change (12 total)

| File | Action | Tasks |
|---|---|---|
| `app/hooks/useFocusTrap.ts` | **CREATE** | Task 1 |
| `results/ScanInterruptModal.tsx` | UPDATE | Tasks 2 (C1, H8, M5) |
| `results/InterruptToast.tsx` | UPDATE | Task 3 (C2) |
| `results/ExpandedJobRow.tsx` | UPDATE | Task 4 (H5) |
| `results/JobTable.tsx` | UPDATE | Task 9 (H4, H10, H13) |
| `config/SectionOrderList.tsx` | UPDATE | Task 5 (H3) |
| `config/CollapsibleSection.tsx` | UPDATE | Task 6 (C3) |
| `shell/AppShell.tsx` | UPDATE | Task 7 (M1, H11, H1) |
| `shell/TabBar.tsx` | UPDATE | Task 8 (H2, M9) |
| `chat/ChatMessage.tsx` | UPDATE | Task 10 (H7) |
| `results/StatusDropdown.tsx` | UPDATE | Task 11 (H9) |
| `globals.css` | UPDATE | Task 12 (H12) |

---

## Execution Order

```
Step 1:  Task 1  — Create useFocusTrap hook (no deps; Task 2 depends on it)
Step 2:  Tasks 3, 4, 10, 11, 12 in parallel — fully independent, 1–5 lines each
Step 3:  Tasks 6, 7, 8 in parallel — CollapsibleSection, AppShell + TabBar (share IDs; each file is self-contained)
Step 4:  Tasks 2, 5 — ScanInterruptModal (depends on Task 1); SectionOrderList (independent)
Step 5:  Task 9  — JobTable (three fixes in one file: ActionMenu, role="grid", source badge)
```

---

## Task Detail

### Task 1 — Create `useFocusTrap` hook
**File:** `apps/web/app/hooks/useFocusTrap.ts` (new)

```ts
// Accepts containerRef and active flag.
// On activate: saves document.activeElement, focuses first focusable in container,
//              adds Tab/Shift+Tab trap listener.
// On deactivate/unmount: removes listener, restores saved focus.
// Focusable selector:
//   'a[href], button:not([disabled]), input:not([disabled]),
//    select:not([disabled]), textarea:not([disabled]),
//    [tabindex]:not([tabindex="-1"])'
```

Validate: `pnpm typecheck`

---

### Task 2 — `ScanInterruptModal` (C1, H8, M5)
**File:** `apps/web/app/components/results/ScanInterruptModal.tsx`

- Add `dialogRef = useRef<HTMLDivElement>(null)` → place on inner panel div (not backdrop)
- Call `useFocusTrap(dialogRef, true)` (always active; component is conditionally mounted)
- Keep existing Escape `useEffect` as-is
- Remove `onClick={() => toggleRow(job.id)}` and `cursor-pointer` from each `<tr>` (checkbox inside already handles toggle)
- Add `scope="col"` to all 4 `<th>` elements

Validate: `pnpm typecheck`

---

### Task 3 — `InterruptToast` (C2)
**File:** `apps/web/app/components/results/InterruptToast.tsx`

- Change outer div: `role="alertdialog"` → `role="alert"`
- Remove `aria-modal="false"` entirely
- Keep `aria-labelledby` and `aria-describedby` (valid on any element)
- `role="alert"` auto-announces on mount (implicit `aria-live="assertive"`); no focus management needed;
  Dismiss / Add-to-tracker buttons stay Tab-reachable in document order

Validate: `pnpm typecheck`

---

### Task 4 — `ExpandedJobRow` (H5)
**File:** `apps/web/app/components/results/ExpandedJobRow.tsx`

- On the inner `role="region"` div (the one with `aria-hidden`):
  replace `aria-hidden={!isExpanded}` with `inert={!isExpanded ? '' : undefined}`
- Remove the `aria-hidden` prop entirely
- React 19 supports `inert` as an HTML attribute; `''` sets the boolean attribute, `undefined` removes it
- `inert` removes descendants from tab order AND hides from AT — fixes both the aria-hidden + focusable conflict
- CSS max-height transition is unaffected

Validate: `pnpm typecheck`

---

### Task 5 — `SectionOrderList` (H3)
**File:** `apps/web/app/components/config/SectionOrderList.tsx`

- Add `tabIndex={0}` to each list item div
- Add `aria-label={\`${label}, position ${index + 1} of ${sections.length}\`}` to each item
- Add `onKeyDown` per item:
  - `ArrowUp` (index > 0): move item up — immutable splice, call `onChange(reordered)`, update live region
  - `ArrowDown` (index < sections.length - 1): move item down, same
  - `preventDefault()` on both to prevent page scroll
- Add a visually hidden `role="status"` div (via ref) to announce position after reorder:
  e.g. `"Experience moved to position 2"`
- Keep all existing drag handlers untouched

Validate: `pnpm typecheck`

---

### Task 6 — `CollapsibleSection` (C3)
**File:** `apps/web/app/components/config/CollapsibleSection.tsx`

- Add `useId` to the React import (alongside existing `useState`)
- Add `const panelId = useId()`
- Add `id={panelId}` to the outer collapsible `<div>` (the one with `maxHeight` inline style)
- Add `aria-controls={panelId}` to the `<button>`

Validate: `pnpm typecheck`

---

### Task 7 — `AppShell` (M1, H11, H1)
**File:** `apps/web/app/components/shell/AppShell.tsx`

**Skip link** — first child of the outer `<div className="flex h-full...">`:
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50
             focus:px-4 focus:py-2 focus:bg-white focus:text-zinc-900 focus:rounded-md
             focus:shadow-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
>
  Skip to main content
</a>
```

**h1** — change brand `<span>` in aside header to `<h1 className="text-sm font-semibold tracking-tight text-zinc-900 m-0">Tailored</h1>`

**Main landmark fix:**
- Remove `role="tabpanel"` and `aria-label` from `<main>`
- Add `id="main-content"` to `<main>` (skip link target)
- Wrap `<TabContent tab={activeTab} />` in:
  ```tsx
  <div
    id="main-tab-panel"
    role="tabpanel"
    aria-labelledby={`${activeTab}-tab`}
    tabIndex={-1}
  >
    <TabContent tab={activeTab} />
  </div>
  ```

Validate: `pnpm typecheck`

---

### Task 8 — `TabBar` (H2, M9)
**File:** `apps/web/app/components/shell/TabBar.tsx`

- Add `tabRefs = useRef<(HTMLButtonElement | null)[]>([])`
- On each tab button:
  - `id={\`${tab.id}-tab\`}` — matches `aria-labelledby` in AppShell
  - `aria-controls="main-tab-panel"` — matches `id` in AppShell
  - `tabIndex={isActive ? 0 : -1}` — roving tabindex
  - `ref={(el) => { tabRefs.current[index] = el }}`
  - `onKeyDown={(e) => handleKeyDown(e, index)}`
- Add `handleKeyDown`:
  ```ts
  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    let next: number | null = null
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length
    if (e.key === 'ArrowLeft')  next = (index - 1 + TABS.length) % TABS.length
    if (next !== null) {
      e.preventDefault()
      setTab(TABS[next]!.id)
      tabRefs.current[next]?.focus()
    }
  }
  ```

Validate: `pnpm typecheck`

---

### Task 9 — `JobTable` (H4, H13, H10)
**File:** `apps/web/app/components/results/JobTable.tsx`

**H13 — remove `role="grid"`:**
Remove `role="grid"` from both `<table>` elements (virtual + non-virtual). A `<table>` already has the implicit `table` role; `grid` incorrectly implies arrow-key cell navigation.

**H10 — source badge visual distinction:**
Change scan badge classes from `bg-zinc-700 text-zinc-300` → `bg-indigo-500/15 text-indigo-400`.
URL-sourced stays `bg-zinc-800 text-zinc-400`. Text (`{job.source}`) remains as the primary differentiator; the visual styles are now clearly distinct.

**H4 — `ActionMenu` keyboard navigation:**
- Add `triggerRef = useRef<HTMLButtonElement>(null)` on the trigger `<button>`
- Add `menuRef = useRef<HTMLDivElement>(null)` on the `role="menu"` div
- Add `useEffect([open])`: when `open` is true, focus first `menuitem` inside `menuRef`
- Add `tabIndex={-1}` to each `role="menuitem"` button (arrow keys navigate; Tab closes)
- Add `onKeyDown` to the `role="menu"` div:
  - `ArrowDown`: focus next menuitem (wrapping)
  - `ArrowUp`: focus previous menuitem (wrapping)
  - `Escape` or `Tab`: `setOpen(false)`, `triggerRef.current?.focus()`

Validate: `pnpm typecheck`

---

### Task 10 — `ChatMessage` (H7)
**File:** `apps/web/app/components/chat/ChatMessage.tsx`

- Remove `role="article"` from both message divs (user and assistant)
- Remove `aria-label="Your message"` and `aria-label="Assistant message"`
- The parent `role="log"` + `aria-live="polite"` on `ChatPanel` provides correct semantics

Validate: `pnpm typecheck`

---

### Task 11 — `StatusDropdown` (H9)
**File:** `apps/web/app/components/results/StatusDropdown.tsx`

- Add `useId` to the React import
- Add `const selectId = useId()`
- Add `id={selectId}` to the `<select>`
- Change `<label className="...">Status</label>` → `<label htmlFor={selectId} className="...">Status</label>`
- Remove `aria-label="Job status"` from `<select>` (now labeled via `htmlFor`)

Validate: `pnpm typecheck`

---

### Task 12 — `globals.css` (H12)
**File:** `apps/web/app/globals.css`

Add after the `.streaming-cursor::after` block:
```css
@media (prefers-reduced-motion: reduce) {
  .streaming-cursor::after {
    animation: none;
  }
}
```

Validate: `pnpm build`

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
| `inert` TypeScript type — React 19 uses `''` not `boolean` | Use `inert={!isExpanded ? '' : undefined}` |
| ActionMenu focus timing — DOM not painted before focus | Wrap in `useEffect` on `open` state, or `setTimeout(..., 0)` |
| TabBar focus after `router.push` — async re-render | Call `tabRefs.current[next]?.focus()` synchronously in handler, before push |
| `useFocusTrap` focusable selector edge cases | App has no shadow DOM; standard selector covers all elements present |
| AppShell h1 layout — browser default h1 margin | Add `m-0` to h1 className |

---

## Acceptance Criteria

- [ ] All 14 issues addressed
- [ ] `pnpm typecheck` passes (0 errors)
- [ ] `pnpm lint` passes (0 errors, ≤ 5 pre-existing warnings)
- [ ] `pnpm build` passes
- [ ] `react-reviewer` agent run on final diff — no CRITICAL or HIGH findings
- [ ] `typescript-reviewer` agent run on final diff — no CRITICAL or HIGH findings
- [ ] `/quality-gate --fix` passes
