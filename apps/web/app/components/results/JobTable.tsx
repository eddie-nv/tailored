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
  LLMOps: 'bg-violet-500/15 text-violet-400',
  Agentic: 'bg-indigo-500/15 text-indigo-400',
  PM: 'bg-sky-500/15 text-sky-400',
  SA: 'bg-teal-500/15 text-teal-400',
  FDE: 'bg-emerald-500/15 text-emerald-400',
  Transformation: 'bg-amber-500/15 text-amber-400',
}

// Total number of columns in the table (used for colSpan on expanded row)
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

  // Keyboard: Escape collapses the expanded row
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedJobId !== null) {
        setExpandedJobId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [expandedJobId])

  // Virtualize only when above threshold and no row is expanded (expanded row has variable height)
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
        className="flex flex-col items-center justify-center flex-1 text-zinc-500 gap-2 select-none px-6 text-center py-16"
      >
        <span className="text-3xl" aria-hidden="true">
          📋
        </span>
        <p className="text-sm font-medium text-zinc-400">No jobs yet</p>
        <p className="text-xs">Paste a job URL above or scan portals to get started</p>
      </div>
    )
  }

  const visibleIds = jobs.map((j) => j.id)
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  const someSelected = visibleIds.some((id) => selectedIds.has(id))

  const tableHead = (
    <thead className="sticky top-0 bg-zinc-950 z-10">
      <tr className="border-b border-zinc-800">
        <th scope="col" className="w-10 px-3 py-2.5">
          <input
            type="checkbox"
            aria-label="Select all visible jobs"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected && !allSelected
            }}
            onChange={() => onToggleSelectAll(visibleIds)}
            className="rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900"
          />
        </th>
        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Company</th>
        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Role</th>
        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Source</th>
        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Archetype</th>
        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Eval</th>
        <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Resume</th>
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
        <table role="grid" aria-label="Job tracker" className="w-full text-sm border-collapse">
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
          focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-indigo-500/60
          ${selected ? 'bg-indigo-500/5' : 'hover:bg-zinc-800/40'}
          ${isExpanded ? 'bg-zinc-800/20' : ''}
          ${job.status === 'archived' ? 'opacity-50' : ''}
          border-b border-zinc-800/60
        `}
      >
        {/* Checkbox */}
        <td className="px-3 py-2.5">
          <input
            type="checkbox"
            aria-label={`Select ${job.company} — ${job.role}`}
            checked={selected}
            onChange={() => onToggleSelect(job.id)}
            className="rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900"
          />
        </td>

        {/* Company — with expand chevron */}
        <td className="px-3 py-2.5 font-medium text-zinc-200 max-w-[160px]">
          <div className="flex items-center gap-1.5 truncate">
            <svg
              aria-hidden="true"
              className={`w-3 h-3 shrink-0 text-zinc-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
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
        <td className="px-3 py-2.5 text-zinc-300 max-w-[200px] truncate">
          {job.url ? (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-300 transition-colors"
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
                ? 'bg-zinc-700 text-zinc-300'
                : 'bg-zinc-800 text-zinc-400'
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
                ARCHETYPE_STYLES[job.archetype] ?? 'bg-zinc-700/50 text-zinc-400'
              }`}
            >
              {job.archetype}
            </span>
          ) : (
            <span className="text-zinc-700 text-xs">—</span>
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
        type="button"
        aria-label={`Actions for ${job.company}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
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
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            aria-label={`Actions for ${job.company}`}
            className="absolute right-0 z-30 mt-1 w-36 rounded border border-zinc-700 bg-zinc-900 shadow-xl py-1 text-xs"
          >
            {job.status !== 'archived' && (
              <button
                role="menuitem"
                type="button"
                onClick={handleArchive}
                className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Archive
              </button>
            )}
            <button
              role="menuitem"
              type="button"
              onClick={handleDelete}
              className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-zinc-800 transition-colors"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}
