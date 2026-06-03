'use client'

import { useState, useEffect, useCallback, useRef, memo } from 'react'
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

  // Keyboard dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onDismiss])

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
    // Backdrop
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss()
      }}
    >
      <div ref={dialogRef} className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2
              id="scan-modal-title"
              className="text-sm font-semibold text-zinc-100"
            >
              Scan results
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {jobs.length} new {jobs.length === 1 ? 'job' : 'jobs'} found — select to evaluate
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          {jobs.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-zinc-500 text-sm">
              No new jobs matched your filters.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
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
                      className="rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900"
                    />
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-zinc-400 font-medium">Company</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-zinc-400 font-medium">Role</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-zinc-400 font-medium">URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(job.id)}
                        onChange={() => toggleRow(job.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${job.role} at ${job.company}`}
                        className="rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-zinc-300 font-medium">{job.company}</td>
                    <td className="px-3 py-2.5 text-zinc-200">{job.role}</td>
                    <td className="px-3 py-2.5">
                      {job.url ? (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 truncate max-w-[200px] block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {new URL(job.url).hostname}
                        </a>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-800 bg-zinc-900/80">
          <span className="text-xs text-zinc-500">
            {selectedIds.size} of {jobs.length} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800 transition-colors"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleEvaluate}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded transition-colors disabled:cursor-not-allowed"
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
