'use client'

import type { InterruptData } from '@/app/hooks/useEvaluation'
import { scoreStyle } from '@/app/lib/scoreStyles'

interface InterruptToastProps {
  interrupt: InterruptData
  onConfirm: () => void
  onDismiss: () => void
}

export function InterruptToast({ interrupt, onConfirm, onDismiss }: InterruptToastProps) {
  const { score, archetype, cvMatchPct } = interrupt.metadata

  return (
    <div
      role="alert"
      aria-labelledby="interrupt-title"
      aria-describedby="interrupt-desc"
      className="mx-3 mb-3 rounded border border-[var(--border-subtle)] bg-white overflow-hidden shadow-sm"
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">
          ✓
        </span>
        <div className="flex-1 min-w-0">
          <p id="interrupt-title" className="text-sm font-semibold text-[var(--foreground)]">
            Evaluation complete
          </p>
          <p id="interrupt-desc" className="text-xs text-[var(--text-muted)] mt-0.5">
            {interrupt.message}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              aria-label={`Score: ${score}`}
              className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${scoreStyle(score)}`}
            >
              {score}
            </span>
            <span className="text-xs text-[var(--text-faint)]">
              {archetype} · {cvMatchPct}% CV match
            </span>
          </div>
        </div>
      </div>

      <div className="flex border-t border-[var(--border-divider)] divide-x divide-[var(--border-divider)]">
        <button
          type="button"
          onClick={onDismiss}
          className="flex-1 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 py-2 text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          Add to tracker
        </button>
      </div>
    </div>
  )
}
