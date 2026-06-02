'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useEvaluation } from '@/app/hooks/useEvaluation'
import { useTracker } from '@/app/hooks/useTracker'
import { UrlPasteBar } from '../results/UrlPasteBar'
import { EvalProgressPanel } from '../results/EvalProgressPanel'
import { InterruptToast } from '../results/InterruptToast'
import { ResultsToolbar } from '../results/ResultsToolbar'
import { JobTable } from '../results/JobTable'
import type { Job } from '@tailored/db'

export function ResultsTab() {
  const eval_ = useEvaluation()
  const tracker = useTracker()

  const pasteInputRef = useRef<{ focus: () => void } | null>(null)
  const prevEvalJobId = useRef<string | null>(null)

  // When an evaluation completes, upsert the job into the tracker's local state
  useEffect(() => {
    const { status, jobId } = eval_.state
    if (status !== 'done' || !jobId || jobId === prevEvalJobId.current) return
    prevEvalJobId.current = jobId

    // Pull fresh data from the interrupt payload if available
    const interrupt = eval_.state.interrupt
    if (interrupt) {
      const { score, archetype, cvMatchPct } = interrupt.metadata
      tracker.upsertJob({
        id: jobId,
        score,
        archetype,
        cvMatchPct,
        status: 'reviewed',
      } as Partial<Job> & { id: string })
    }

    // Also refresh snapshot to pick up any fields not in the interrupt metadata
    void tracker.refresh()
  }, [eval_.state.status, eval_.state.jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  const isEvalLoading = eval_.state.status === 'creating-job' || eval_.state.status === 'evaluating'

  const handleConfirmInterrupt = useCallback(async () => {
    if (!eval_.state.jobId) return
    await tracker.updateStatus(eval_.state.jobId, 'reviewed')
    eval_.dismissInterrupt()
  }, [eval_.state.jobId, eval_.dismissInterrupt, tracker])

  const handleFocusPaste = useCallback(() => {
    // Scroll to top of results tab and focus the paste bar
    pasteInputRef.current?.focus()
  }, [])

  const visibleJobIds = tracker.visibleJobs.map((j) => j.id)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Paste bar */}
      <UrlPasteBar onSubmit={eval_.evaluate} isLoading={isEvalLoading} ref={pasteInputRef} />

      {/* Toolbar */}
      <ResultsToolbar
        selectedCount={tracker.state.selectedIds.size}
        showArchived={tracker.state.showArchived}
        onToggleArchived={tracker.setShowArchived}
        onFocusPaste={handleFocusPaste}
      />

      {/* Eval progress panel */}
      {eval_.state.status !== 'idle' && (
        <EvalProgressPanel
          steps={eval_.state.steps}
          streamedText={eval_.state.streamedText}
          status={eval_.state.status}
          error={eval_.state.error}
        />
      )}

      {/* Interrupt toast */}
      {eval_.state.interrupt && (
        <InterruptToast
          interrupt={eval_.state.interrupt}
          onConfirm={handleConfirmInterrupt}
          onDismiss={eval_.dismissInterrupt}
        />
      )}

      {/* Loading skeleton */}
      {tracker.state.isLoading && (
        <div
          role="status"
          aria-label="Loading jobs"
          className="flex items-center justify-center flex-1 text-zinc-500 text-sm"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4 animate-spin mr-2 text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading jobs…
        </div>
      )}

      {/* Error state */}
      {!tracker.state.isLoading && tracker.state.error && (
        <div
          role="alert"
          className="flex items-center justify-center flex-1 text-red-400 text-sm gap-2"
        >
          <span>✕</span>
          <span>{tracker.state.error}</span>
          <button
            type="button"
            onClick={tracker.refresh}
            className="underline text-xs ml-1"
          >
            Retry
          </button>
        </div>
      )}

      {/* Job table */}
      {!tracker.state.isLoading && !tracker.state.error && (
        <JobTable
          jobs={tracker.visibleJobs}
          selectedIds={tracker.state.selectedIds}
          activeEvalSteps={tracker.state.activeEvalSteps}
          onToggleSelect={tracker.toggleSelect}
          onToggleSelectAll={tracker.toggleSelectAll}
          onArchive={tracker.archiveJob}
          onDelete={tracker.deleteJob}
        />
      )}
    </div>
  )
}
