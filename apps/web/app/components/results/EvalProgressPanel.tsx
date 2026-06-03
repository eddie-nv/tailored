'use client'

import type { EvalStep } from '@/app/hooks/useEvaluation'

const STEP_LABELS: Record<string, string> = {
  'archetype-detection': 'Detecting role archetype',
  scoring: 'Scoring against rubric',
  'cv-match': 'Matching CV to requirements',
  'compensation-research': 'Researching compensation',
  'report-generation': 'Generating evaluation report',
}

interface EvalProgressPanelProps {
  steps: EvalStep[]
  streamedText: string
  status: 'creating-job' | 'evaluating' | 'done' | 'error'
  error: string | null
}

export function EvalProgressPanel({ steps, streamedText, status, error }: EvalProgressPanelProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Evaluation progress"
      className="mx-3 mb-3 rounded border border-[var(--border-subtle)] bg-white text-sm overflow-hidden shadow-sm"
    >
      {status === 'creating-job' && (
        <div className="px-4 py-3 text-[var(--text-muted)] flex items-center gap-2">
          <Spinner />
          <span>Creating job record…</span>
        </div>
      )}

      {(status === 'evaluating' || status === 'done') && (
        <div className="divide-y divide-[var(--border-divider)]">
          {steps.map((step) => (
            <div key={step.name} className="flex items-center gap-3 px-4 py-2.5">
              <StepIcon status={step.status} />
              <span
                className={
                  step.status === 'active'
                    ? 'text-[var(--foreground)] font-medium'
                    : step.status === 'done'
                      ? 'text-[var(--text-muted)]'
                      : 'text-[var(--text-subtle)]'
                }
              >
                {STEP_LABELS[step.name] ?? step.name}
              </span>
              {step.status === 'active' && <Spinner className="ml-auto" />}
              {step.status === 'done' && (
                <span className="ml-auto text-emerald-500 text-xs">Done</span>
              )}
            </div>
          ))}
        </div>
      )}

      {streamedText && (
        <div className="px-4 py-3 border-t border-[var(--border-divider)]">
          <p className="text-xs text-[var(--text-faint)] mb-1.5 font-medium uppercase tracking-wide">
            Evaluation Report
          </p>
          <div className="text-[var(--text-secondary)] text-xs leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
            {streamedText}
          </div>
        </div>
      )}

      {status === 'error' && error && (
        <div className="px-4 py-3 text-red-600 flex items-start gap-2">
          <span className="shrink-0">✕</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

function StepIcon({ status }: { status: EvalStep['status'] }) {
  if (status === 'done') {
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
  if (status === 'active') {
    return (
      <span
        aria-hidden="true"
        className="w-4 h-4 rounded-full border-2 border-[var(--accent)] shrink-0"
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className="w-4 h-4 rounded-full border-2 border-[var(--border-subtle)] shrink-0"
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
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
