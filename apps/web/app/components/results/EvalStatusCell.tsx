'use client'

import { memo } from 'react'
import { scoreStyle } from '@/app/lib/scoreStyles'

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
      <span className="flex items-center gap-1.5 text-xs text-[var(--accent)]">
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
    return (
      <span
        aria-label={`Match score: ${score} (A is best, F is worst)`}
        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${scoreStyle(score)}`}
      >
        {score}
      </span>
    )
  }

  // New / not evaluated
  if (status === 'new') {
    return <span className="text-xs text-[var(--text-subtle)]">New</span>
  }

  return <span className="text-xs text-[var(--text-faint)] capitalize">{status}</span>
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
