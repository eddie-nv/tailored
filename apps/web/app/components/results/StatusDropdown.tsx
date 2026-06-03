'use client'

import { memo, useState, useCallback, useId } from 'react'

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'applying', label: 'Applying' },
  { value: 'applied', label: 'Applied' },
  { value: 'archived', label: 'Archived' },
] as const

type JobStatus = (typeof STATUS_OPTIONS)[number]['value']

const STATUS_STYLES: Record<string, string> = {
  new: 'text-[var(--text-muted)] bg-[var(--surface-sunken)] border-[var(--border-subtle)]',
  reviewed: 'text-blue-600 bg-blue-50 border-blue-200',
  applying: 'text-amber-600 bg-amber-50 border-amber-200',
  applied: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  archived: 'text-[var(--text-faint)] bg-[var(--surface)] border-[var(--border-subtle)]',
}

interface StatusDropdownProps {
  jobId: string
  status: string
  onUpdate: (jobId: string, status: string) => Promise<void>
}

export const StatusDropdown = memo(function StatusDropdown({
  jobId,
  status,
  onUpdate,
}: StatusDropdownProps) {
  const selectId = useId()
  const [isSaving, setIsSaving] = useState(false)
  const [localStatus, setLocalStatus] = useState(status)

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value as JobStatus
      const prevStatus = localStatus
      setLocalStatus(newStatus)
      setIsSaving(true)
      try {
        await onUpdate(jobId, newStatus)
      } catch {
        setLocalStatus(prevStatus)
      } finally {
        setIsSaving(false)
      }
    },
    [jobId, localStatus, onUpdate],
  )

  const styleClass = STATUS_STYLES[localStatus] ?? STATUS_STYLES['new']!

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={selectId} className="text-xs text-[var(--text-faint)] font-medium shrink-0">Status</label>
      <div className="relative">
        <select
          id={selectId}
          value={localStatus}
          onChange={handleChange}
          disabled={isSaving}
          className={`
            appearance-none rounded border px-2.5 py-1 pr-6 text-xs font-medium
            focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/60
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors cursor-pointer
            ${styleClass}
          `}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white text-[var(--foreground)]">
              {opt.label}
            </option>
          ))}
        </select>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2"
        >
          {isSaving ? (
            <svg className="w-3 h-3 animate-spin text-current opacity-60" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3 h-3 text-current opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  )
})
