'use client'

import { memo } from 'react'

const SCORE_STYLES: Record<string, string> = {
  A: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  'B+': 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
  B: 'bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20',
  C: 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20',
  D: 'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20',
  F: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
}

interface EvalStatusCellProps {
  score: string | null
  status: string
  activeStep: string | null
}

export const EvalStatusCell = memo(function EvalStatusCell({
  score,
  status,
  activeStep,
}: EvalStatusCellProps) {
  // Active evaluation in progress
  if (activeStep) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-indigo-400">
        <svg
          aria-hidden="true"
          className="w-3 h-3 animate-spin shrink-0"
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
        <span className="truncate max-w-[100px]">{stepLabel(activeStep)}</span>
      </span>
    )
  }

  // Evaluated — show grade badge
  if (score) {
    const style = SCORE_STYLES[score] ?? SCORE_STYLES['C']!
    return (
      <span
        aria-label={`Score ${score}`}
        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${style}`}
      >
        {score}
      </span>
    )
  }

  // New / not evaluated
  if (status === 'new') {
    return <span className="text-xs text-zinc-600">New</span>
  }

  return <span className="text-xs text-zinc-500 capitalize">{status}</span>
})

const STEP_LABELS: Record<string, string> = {
  'archetype-detection': 'Detecting…',
  scoring: 'Scoring…',
  'cv-match': 'CV match…',
  'compensation-research': 'Comp…',
  'report-generation': 'Report…',
}

function stepLabel(step: string): string {
  return STEP_LABELS[step] ?? step
}
