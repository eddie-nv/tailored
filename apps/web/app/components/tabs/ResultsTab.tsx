'use client'

import { useCallback } from 'react'
import { useEvaluation } from '@/app/hooks/useEvaluation'
import { UrlPasteBar } from '../results/UrlPasteBar'
import { EvalProgressPanel } from '../results/EvalProgressPanel'
import { InterruptToast } from '../results/InterruptToast'

export function ResultsTab() {
  const { state, evaluate, reset, dismissInterrupt } = useEvaluation()

  const isLoading = state.status === 'creating-job' || state.status === 'evaluating'

  const handleConfirmInterrupt = useCallback(async () => {
    if (!state.jobId) return
    // Optimistically dismiss — TrackerAgent (M6) will own the status flow
    dismissInterrupt()
  }, [state.jobId, dismissInterrupt])

  return (
    <div className="flex flex-col h-full">
      <UrlPasteBar onSubmit={evaluate} isLoading={isLoading} />

      {state.status !== 'idle' && (
        <EvalProgressPanel
          steps={state.steps}
          streamedText={state.streamedText}
          status={state.status}
          error={state.error}
        />
      )}

      {state.interrupt && (
        <InterruptToast
          interrupt={state.interrupt}
          onConfirm={handleConfirmInterrupt}
          onDismiss={dismissInterrupt}
        />
      )}

      {state.status === 'idle' && (
        <div className="flex flex-col items-center justify-center flex-1 text-zinc-500 gap-2 select-none px-6 text-center">
          <span className="text-3xl" aria-hidden="true">
            📊
          </span>
          <p className="text-sm font-medium text-zinc-400">No jobs evaluated yet</p>
          <p className="text-xs">
            Paste a job URL or description above to start an evaluation.
            <br />
            The full results table arrives in M6.
          </p>
        </div>
      )}

      {state.status === 'done' && !state.interrupt && (
        <div className="flex flex-col items-center justify-center flex-1 text-zinc-500 gap-3 select-none">
          <p className="text-sm text-zinc-400">Evaluation saved.</p>
          <button
            type="button"
            onClick={reset}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
          >
            Evaluate another job
          </button>
        </div>
      )}
    </div>
  )
}
