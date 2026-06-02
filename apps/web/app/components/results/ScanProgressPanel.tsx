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
      className="mx-3 mb-3 rounded border border-zinc-700 bg-zinc-900 text-sm overflow-hidden"
    >
      {/* Header with progress bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-300 font-medium text-xs uppercase tracking-wide">
            {status === 'done' ? 'Scan complete' : 'Scanning portals…'}
          </span>
          <span className="text-xs font-semibold tabular-nums">
            <span className="text-indigo-400">{found}</span>
            <span className="text-zinc-500"> new {found === 1 ? 'job' : 'jobs'} found</span>
          </span>
        </div>

        {/* Progress bar */}
        <div
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={total || 1}
          aria-label={`${done} of ${total} portals scanned`}
          className="h-1.5 bg-zinc-800 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-1.5 text-xs text-zinc-500 tabular-nums">
          {done} / {total} portals
        </p>
      </div>

      {/* Platform list */}
      {platforms.length > 0 && (
        <div className="border-t border-zinc-800 divide-y divide-zinc-800">
          {platforms.map((p) => (
            <div key={p.name} className="flex items-center gap-3 px-4 py-2">
              <PlatformIcon done={p.done} />
              <span
                className={
                  p.done ? 'text-zinc-400 text-xs' : 'text-zinc-100 text-xs font-medium'
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
        <div className="px-4 py-3 border-t border-zinc-800 text-red-400 flex items-start gap-2">
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
      className="w-4 h-4 rounded-full border-2 border-indigo-400 shrink-0"
    />
  )
}

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`w-3.5 h-3.5 animate-spin text-indigo-400 ${className}`}
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
