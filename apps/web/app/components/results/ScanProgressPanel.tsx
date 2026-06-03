'use client'

import { memo } from 'react'
import type { PlatformEntry, ScanStatus } from '@/app/hooks/useScanner'

interface ScanProgressPanelProps {
  total: number
  done: number
  found: number
  platforms: PlatformEntry[]
  status: Extract<ScanStatus, 'scanning' | 'done' | 'error'>
  error: string | null
}

export const ScanProgressPanel = memo(function ScanProgressPanel({
  total,
  done,
  found,
  platforms,
  status,
  error,
}: ScanProgressPanelProps) {
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Portal scan progress"
      className="mx-3 mb-3 rounded border border-[var(--border-subtle)] bg-white text-sm overflow-hidden shadow-sm"
    >
      {/* Header with progress bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[var(--foreground)] font-medium text-xs uppercase tracking-wide">
            {status === 'done' ? 'Scan complete' : 'Scanning portals…'}
          </span>
          <span className="text-xs font-semibold tabular-nums">
            <span className="text-[var(--accent)]">{found}</span>
            <span className="text-[var(--text-faint)]"> new {found === 1 ? 'job' : 'jobs'} found</span>
          </span>
        </div>

        {/* Progress bar */}
        <div
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={total || 1}
          aria-label={`${done} of ${total} portals scanned`}
          className="h-1.5 bg-[var(--surface-disabled)] rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-1.5 text-xs text-[var(--text-faint)] tabular-nums">
          {done} / {total} portals
        </p>
      </div>

      {/* Platform list */}
      {platforms.length > 0 && (
        <div className="border-t border-[var(--border-divider)] divide-y divide-[var(--border-divider)]">
          {platforms.map((p) => (
            <div key={p.name} className="flex items-center gap-3 px-4 py-2">
              <PlatformIcon done={p.done} />
              <span
                className={
                  p.done ? 'text-[var(--text-muted)] text-xs' : 'text-[var(--foreground)] text-xs font-medium'
                }
              >
                {p.name}
              </span>
              {!p.done && status === 'scanning' && (
                <Spinner className="ml-auto" />
              )}
              {p.done && (
                <span className="ml-auto text-emerald-500 text-xs">Done</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {status === 'error' && error && (
        <div className="px-4 py-3 border-t border-[var(--border-divider)] text-red-600 flex items-start gap-2">
          <span className="shrink-0 text-xs">✕</span>
          <span className="text-xs">{error}</span>
        </div>
      )}
    </div>
  )
})

function PlatformIcon({ done }: { done: boolean }) {
  if (done) {
    return (
      <svg
        aria-hidden="true"
        className="w-4 h-4 text-emerald-500 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  return (
    <span
      aria-hidden="true"
      className="w-4 h-4 rounded-full border-2 border-[var(--accent)] shrink-0"
    />
  )
}

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`w-3.5 h-3.5 animate-spin text-[var(--accent)] ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
