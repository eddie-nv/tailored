'use client'

import { memo, useCallback, useState, useId, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { JobWithResumes } from '@tailored/db'
import { EvalStatusCell } from './EvalStatusCell'
import { ResumeCell } from './ResumeCell'
import { ExpandedJobRow } from './ExpandedJobRow'

const VIRTUALIZE_THRESHOLD = 100
const ESTIMATED_ROW_HEIGHT = 46

const ARCHETYPE_STYLES: Record<string, string> = {
  LLMOps: 'bg-violet-500/10 text-violet-600',
  Agentic: 'bg-blue-500/10 text-blue-600',
  PM: 'bg-sky-500/10 text-sky-600',
  SA: 'bg-teal-500/10 text-teal-600',
  FDE: 'bg-emerald-500/10 text-emerald-600',
  Transformation: 'bg-amber-500/10 text-amber-600',
}

const COL_SPAN = 8

interface JobTableProps {
  jobs: JobWithResumes[]
  selectedIds: Set<string>
  activeEvalSteps: Map<string, string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: (visibleIds: string[]) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onUpdateStatus: (jobId: string, status: string) => Promise<void>
  onUpdateNotes: (jobId: string, notes: string) => Promise<void>
}

export function JobTable({
  jobs,
  selectedIds,
  activeEvalSteps,
  onToggleSelect,
  onToggleSelectAll,
  onArchive,
  onDelete,
  onUpdateStatus,
  onUpdateNotes,
}: JobTableProps) {
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedJobId((prev) => (prev === id ? null : id))
  }, [])

  const handleCollapse = useCallback(() => {
    setExpandedJobId(null)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedJobId !== null) {
        setExpandedJobId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [expandedJobId])

  const shouldVirtualize = jobs.length >= VIRTUALIZE_THRESHOLD && expandedJobId === null

  const virtualizer = useVirtualizer({
    count: jobs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    enabled: shouldVirtualize,
    overscan: 10,
  })

  if (jobs.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center flex-1 text-[var(--text-faint)] gap-2 select-none px-6 text-center py-16"
      >
        <span className="text-3xl" aria-hidden="true">
          📋
        </span>
        <p className="text-sm font-medium text-[var(--text-muted)]">No jobs yet</p>
        <p className="text-xs">Paste a job URL above or scan portals to get started</p>
      </div>
    )
  }

  const visibleIds = jobs.map((j) => j.id)
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  const someSelected = visibleIds.some((id) => selectedIds.has(id))

  const tableHead = (
    <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_0_var(--border-subtle)]">
      <tr className="border-b border-[var(--border-divider)]">
        <th scope="col" className="w-10 px-3 py-2.5">
          <input
            type="checkbox"
            aria-label="Select all visible jobs"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected && !allSelected
            }}
            onChange={() => onToggleSelectAll(visibleIds)}
            className="rounded border-[var(--text-faint)] bg-white text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-white"
          />
        </th>
        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Company</th>
        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Role</th>
        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Source</th>
        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Archetype</th>
        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Eval</th>
        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Resume</th>
        <th scope="col" className="w-10 px-3 py-2.5"><span className="sr-only">Actions</span></th>
      </tr>
    </thead>
  )

  const sharedCallbacks = {
    onToggleExpand: handleToggleExpand,
    onCollapse: handleCollapse,
    onToggleSelect,
    onArchive,
    onDelete,
    onUpdateStatus,
    onUpdateNotes,
  }

  if (shouldVirtualize) {
    const virtualItems = virtualizer.getVirtualItems()
    const paddingTop = virtualItems.length > 0 ? virtualItems[0]!.start : 0
    const paddingBottom =
      virtualItems.length > 0
        ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1]!.end
        : 0

    return (
      <div ref={scrollRef} className="overflow-auto flex-1">
        <table aria-label="Job tracker" className="w-full text-sm border-collapse">
          {tableHead}
          <tbody>
            {paddingTop > 0 && (
              <tr aria-hidden="true">
                <td colSpan={COL_SPAN} style={{ height: paddingTop, padding: 0 }} />
              </tr>
            )}
            {virtualItems.map((virtualRow) => {
              const job = jobs[virtualRow.index]!
              return (
                <JobRowGroup
                  key={job.id}
                  job={job}
                  selected={selectedIds.has(job.id)}
                  activeStep={activeEvalSteps.get(job.id) ?? null}
                  isExpanded={false}
                  {...sharedCallbacks}
                />
              )
            })}
            {paddingBottom > 0 && (
              <tr aria-hidden="true">
                <td colSpan={COL_SPAN} style={{ height: paddingBottom, padding: 0 }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="overflow-auto flex-1">
      <table role="grid" aria-label="Job tracker" className="w-full text-sm border-collapse">
        {tableHead}
        <tbody>
          {jobs.map((job) => (
            <JobRowGroup
              key={job.id}
              job={job}
              selected={selectedIds.has(job.id)}
              activeStep={activeEvalSteps.get(job.id) ?? null}
              isExpanded={expandedJobId === job.id}
              {...sharedCallbacks}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface JobRowGroupProps {
  job: JobWithResumes
  selected: boolean
  activeStep: string | null
  isExpanded: boolean
  onToggleExpand: (id: string) => void
  onCollapse: () => void
  onToggleSelect: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onUpdateStatus: (jobId: string, status: string) => Promise<void>
  onUpdateNotes: (jobId: string, notes: string) => Promise<void>
}

const JobRowGroup = memo(function JobRowGroup({
  job,
  selected,
  activeStep,
  isExpanded,
  onToggleExpand,
  onCollapse,
  onToggleSelect,
  onArchive,
  onDelete,
  onUpdateStatus,
  onUpdateNotes,
}: JobRowGroupProps) {
  const panelId = useId()
  const rowRef = useRef<HTMLTableRowElement>(null)
  const evaluated = job.score !== null && job.status !== 'new'
  const latestResume = job.resumes.length > 0
    ? job.resumes[job.resumes.length - 1]!
    : null
  const resumeDownloadUrl = latestResume ? `/api/resumes/${latestResume.id}` : null
  const resumeFilename = latestResume?.filename ?? null

  const handleRowClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest('input[type="checkbox"]') ||
        target.closest('a') ||
        target.closest('button') ||
        target.closest('select')
      ) {
        return
      }
      onToggleExpand(job.id)
    },
    [job.id, onToggleExpand],
  )

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onToggleExpand(job.id)
      }
    },
    [job.id, onToggleExpand],
  )

  return (
    <>
      <tr
        ref={rowRef}
        tabIndex={0}
        aria-selected={selected}
        aria-expanded={isExpanded}
        aria-controls={isExpanded ? panelId : undefined}
        onClick={handleRowClick}
        onKeyDown={handleRowKeyDown}
        className={`
          group transition-colors cursor-pointer outline-none
          focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/50
          ${selected ? 'bg-[var(--accent)]/5' : 'even:bg-[var(--surface)] hover:bg-[var(--surface-hover)]'}
          ${isExpanded ? 'bg-[var(--surface-sunken)]' : ''}
          ${job.status === 'archived' ? 'opacity-50' : ''}
          border-b border-[var(--border-divider)]
        `}
      >
        {/* Checkbox */}
        <td className="px-3 py-2.5">
          <input
            type="checkbox"
            aria-label={`Select ${job.company} — ${job.role}`}
            checked={selected}
            onChange={() => onToggleSelect(job.id)}
            className="rounded border-[var(--text-faint)] bg-white text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-white"
          />
        </td>

        {/* Company — with expand chevron */}
        <td className="px-3 py-2.5 font-medium text-[var(--foreground)] max-w-[160px]">
          <div className="flex items-center gap-1.5 truncate">
            <svg
              aria-hidden="true"
              className={`w-3 h-3 shrink-0 text-[var(--text-faint)] group-hover:text-[var(--foreground)] transition-[transform,color] duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="truncate">{job.company}</span>
          </div>
        </td>

        {/* Role */}
        <td className="px-3 py-2.5 text-[var(--text-secondary)] max-w-[200px] truncate">
          {job.url ? (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-[var(--text-faint)] hover:decoration-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              {job.role}
            </a>
          ) : (
            job.role
          )}
        </td>

        {/* Source badge */}
        <td className="px-3 py-2.5">
          <span
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
              job.source === 'scan'
                ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'bg-[var(--surface-sunken)] text-[var(--text-muted)]'
            }`}
          >
            {job.source}
          </span>
        </td>

        {/* Archetype chip */}
        <td className="px-3 py-2.5">
          {job.archetype ? (
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                ARCHETYPE_STYLES[job.archetype] ?? 'bg-[var(--surface-sunken)] text-[var(--text-muted)]'
              }`}
            >
              {job.archetype}
            </span>
          ) : (
            <span className="text-[var(--text-subtle)] text-xs">—</span>
          )}
        </td>

        {/* Eval status */}
        <td className="px-3 py-2.5">
          <EvalStatusCell score={job.score} status={job.status} activeStep={activeStep} />
        </td>

        {/* Resume */}
        <td className="px-3 py-2.5">
          <ResumeCell
            evaluated={evaluated}
            resumeDownloadUrl={resumeDownloadUrl}
            resumeFilename={resumeFilename}
            jobId={job.id}
          />
        </td>

        {/* Actions */}
        <td className="px-3 py-2.5">
          <ActionMenu job={job} onArchive={onArchive} onDelete={onDelete} />
        </td>
      </tr>

      <ExpandedJobRow
        job={job}
        isExpanded={isExpanded}
        colSpan={COL_SPAN}
        onCollapse={onCollapse}
        onUpdateStatus={onUpdateStatus}
        onUpdateNotes={onUpdateNotes}
        onArchive={onArchive}
      />
    </>
  )
})

function ActionMenu({
  job,
  onArchive,
  onDelete,
}: {
  job: JobWithResumes
  onArchive: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !menuRef.current) return
    const items = menuRef.current.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
    items[0]?.focus()
  }, [open])

  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!menuRef.current) return
      const items = Array.from(menuRef.current.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
      const current = document.activeElement as HTMLElement
      const idx = items.indexOf(current as HTMLButtonElement)
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        items[(idx + 1) % items.length]?.focus()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        items[(idx - 1 + items.length) % items.length]?.focus()
      } else if (e.key === 'Escape' || e.key === 'Tab') {
        e.preventDefault()
        close()
      }
    },
    [close],
  )

  const handleArchive = useCallback(() => {
    setOpen(false)
    onArchive(job.id)
  }, [job.id, onArchive])

  const handleDelete = useCallback(() => {
    setOpen(false)
    onDelete(job.id)
  }, [job.id, onDelete])

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Actions for ${job.company}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="opacity-25 group-hover:opacity-100 focus:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--foreground)] rounded transition-opacity"
      >
        <svg aria-hidden="true" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <>
          <div
            role="presentation"
            className="fixed inset-0 z-20"
            onClick={close}
          />
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Actions for ${job.company}`}
            onKeyDown={handleMenuKeyDown}
            className="absolute right-0 z-30 mt-1 w-36 rounded border border-[var(--border-subtle)] bg-white shadow-lg py-1 text-xs"
          >
            {job.status !== 'archived' && (
              <button
                role="menuitem"
                tabIndex={-1}
                type="button"
                onClick={handleArchive}
                className="w-full text-left px-3 py-1.5 text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                Archive
              </button>
            )}
            <button
              role="menuitem"
              tabIndex={-1}
              type="button"
              onClick={handleDelete}
              className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-[var(--surface-hover)] transition-colors"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}
