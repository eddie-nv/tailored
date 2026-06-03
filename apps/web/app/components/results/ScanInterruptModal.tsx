'use client'

import { useState, useCallback, useRef, memo } from 'react'
import type { NewJob } from '@/app/hooks/useScanner'
import { useFocusTrap } from '@/app/hooks/useFocusTrap'

interface ScanInterruptModalProps {
  jobs: NewJob[]
  onEvaluateSelected: (ids: string[]) => void
  onDismiss: () => void
}

export const ScanInterruptModal = memo(function ScanInterruptModal({
  jobs,
  onEvaluateSelected,
  onDismiss,
}: ScanInterruptModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(jobs.map((j) => j.id)),
  )
  useFocusTrap(dialogRef, true)

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const allSelected = jobs.length > 0 && jobs.every((j) => selectedIds.has(j.id))
  const someSelected = jobs.some((j) => selectedIds.has(j.id))

  const toggleAll = useCallback(() => {
    setSelectedIds(allSelected ? new Set() : new Set(jobs.map((j) => j.id)))
  }, [allSelected, jobs])

  const handleEvaluate = useCallback(() => {
    onEvaluateSelected(Array.from(selectedIds))
  }, [selectedIds, onEvaluateSelected])

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- purely visual overlay; inner dialog (role="dialog") is the interactive element
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onDismiss()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-modal-title"
        className="w-full max-w-2xl bg-white border border-[var(--border-subtle)] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-divider)]">
          <div>
            <h2
              id="scan-modal-title"
              className="text-sm font-semibold text-[var(--foreground)]"
            >
              Scan results
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {jobs.length} new {jobs.length === 1 ? 'job' : 'jobs'} found — select to evaluate
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          {jobs.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-[var(--text-faint)] text-sm">
              No new jobs matched your filters.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white border-b border-[var(--border-divider)]">
                <tr>
                  <th scope="col" className="w-10 px-4 py-2.5 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected && !allSelected
                      }}
                      onChange={toggleAll}
                      aria-label="Select all"
                      className="rounded border-[var(--text-faint)] bg-white text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-white"
                    />
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[var(--text-muted)] font-medium">Company</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[var(--text-muted)] font-medium">Role</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[var(--text-muted)] font-medium">URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-divider)]">
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(job.id)}
                        onChange={() => toggleRow(job.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${job.role} at ${job.company}`}
                        className="rounded border-[var(--text-faint)] bg-white text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-white"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-[var(--text-secondary)] font-medium">{job.company}</td>
                    <td className="px-3 py-2.5 text-[var(--foreground)]">{job.role}</td>
                    <td className="px-3 py-2.5">
                      {job.url ? (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline underline-offset-2 truncate max-w-[200px] block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {new URL(job.url).hostname}
                        </a>
                      ) : (
                        <span className="text-[var(--text-faint)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--border-divider)] bg-[var(--surface)]">
          <span className="text-xs text-[var(--text-muted)]">
            {selectedIds.size} of {jobs.length} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] rounded hover:bg-[var(--surface-sunken)] transition-colors"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleEvaluate}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--surface-disabled)] disabled:text-[var(--text-faint)] text-white rounded transition-colors disabled:cursor-not-allowed"
            >
              <span aria-hidden="true">▶</span>
              Evaluate Selected ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})
