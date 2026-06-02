'use client'

import type { InterruptData } from '@/app/hooks/useEvaluation'

interface InterruptToastProps {
  interrupt: InterruptData
  onConfirm: () => void
  onDismiss: () => void
}

const SCORE_COLORS: Record<string, string> = {
  A: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  'B+': 'bg-blue-500/15 text-blue-400 ring-blue-500/30',
  B: 'bg-blue-500/10 text-blue-300 ring-blue-500/20',
  C: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
  D: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
  F: 'bg-red-500/10 text-red-400 ring-red-500/20',
}

export function InterruptToast({ interrupt, onConfirm, onDismiss }: InterruptToastProps) {
  const { score, archetype, cvMatchPct } = interrupt.metadata
  const scoreColor = SCORE_COLORS[score] ?? SCORE_COLORS['C']!

  return (
    <div
      role="alertdialog"
      aria-modal="false"
      aria-labelledby="interrupt-title"
      aria-describedby="interrupt-desc"
      className="mx-3 mb-3 rounded border border-zinc-700 bg-zinc-900 overflow-hidden"
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">
          ✓
        </span>
        <div className="flex-1 min-w-0">
          <p id="interrupt-title" className="text-sm font-semibold text-zinc-100">
            Evaluation complete
          </p>
          <p id="interrupt-desc" className="text-xs text-zinc-400 mt-0.5">
            {interrupt.message}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              aria-label={`Score: ${score}`}
              className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ring-1 ${scoreColor}`}
            >
              {score}
            </span>
            <span className="text-xs text-zinc-500">
              {archetype} · {cvMatchPct}% CV match
            </span>
          </div>
        </div>
      </div>

      <div className="flex border-t border-zinc-800 divide-x divide-zinc-800">
        <button
          type="button"
          onClick={onDismiss}
          className="flex-1 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 py-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-zinc-800 transition-colors"
        >
          Add to tracker
        </button>
      </div>
    </div>
  )
}
