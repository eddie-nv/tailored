'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useEvaluation } from '@/app/hooks/useEvaluation'
import { useTracker } from '@/app/hooks/useTracker'
import { useScanner } from '@/app/hooks/useScanner'
import { useBatch } from '@/app/hooks/useBatch'
import { UrlPasteBar } from '../results/UrlPasteBar'
import { EvalProgressPanel } from '../results/EvalProgressPanel'
import { ScanProgressPanel } from '../results/ScanProgressPanel'
import { ScanInterruptModal } from '../results/ScanInterruptModal'
import { InterruptToast } from '../results/InterruptToast'
import { ResultsToolbar } from '../results/ResultsToolbar'
import { JobTable } from '../results/JobTable'
import type { Job } from '@tailored/db'

export function ResultsTab() {
  const eval_ = useEvaluation()
  const tracker = useTracker()
  const scanner = useScanner(tracker.refresh)
  const batch = useBatch(tracker.setActiveEvalStep, tracker.refresh)

  const pasteInputRef = useRef<{ focus: () => void } | null>(null)
  const prevEvalJobId = useRef<string | null>(null)

  // When a single evaluation completes, upsert the job into tracker's local state
  useEffect(() => {
    const { status, jobId } = eval_.state
    if (status !== 'done' || !jobId || jobId === prevEvalJobId.current) return
    prevEvalJobId.current = jobId

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

    void tracker.refresh()
  }, [eval_.state.status, eval_.state.jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  const isEvalLoading = eval_.state.status === 'creating-job' || eval_.state.status === 'evaluating'

  const handleConfirmInterrupt = useCallback(async () => {
    if (!eval_.state.jobId) return
    await tracker.updateStatus(eval_.state.jobId, 'reviewed')
    eval_.dismissInterrupt()
  }, [eval_.state.jobId, eval_.dismissInterrupt, tracker])

  const handleFocusPaste = useCallback(() => {
    pasteInputRef.current?.focus()
  }, [])

  // Batch-evaluate the currently selected rows
  const handleEvaluateSelected = useCallback(() => {
    const ids = [...tracker.state.selectedIds]
    if (ids.length === 0) return
    void batch.runBatch(ids)
    tracker.toggleSelectAll(ids)
  }, [batch, tracker])

  // Batch-evaluate jobs chosen from the scan interrupt modal
  const handleEvaluateFromScan = useCallback(
    (selectedIds: string[]) => {
      if (selectedIds.length === 0) return
      void batch.runBatch(selectedIds)
      scanner.dismissScan()
    },
    [batch, scanner],
  )

  const isBatchRunning = batch.state.status === 'running'
  const batchProgress = isBatchRunning
    ? { completed: batch.state.completed, total: batch.state.total }
    : undefined

  const showScanProgress =
    scanner.state.status === 'scanning' || scanner.state.status === 'error'

  const showScanModal =
    scanner.state.status === 'done' && scanner.state.newJobs.length > 0

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
        onScan={scanner.scan}
        isScanRunning={scanner.state.status === 'scanning'}
        onEvaluateSelected={handleEvaluateSelected}
        isBatchRunning={isBatchRunning}
        batchProgress={batchProgress}
      />

      {/* Batch concurrency indicator */}
      {isBatchRunning && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-900/20 border-b border-indigo-500/20 text-xs text-indigo-300">
          <svg aria-hidden="true" className="w-3 h-3 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Evaluating {batch.state.completed} of {batch.state.total} jobs…
        </div>
      )}

      {/* Scan progress panel */}
      {showScanProgress && (
        <ScanProgressPanel
          total={scanner.state.total}
          done={scanner.state.done}
          found={scanner.state.found}
          platforms={scanner.state.platforms}
          status={scanner.state.status === 'error' ? 'error' : 'scanning'}
          error={scanner.state.error}
        />
      )}

      {/* Single-eval progress panel */}
      {eval_.state.status !== 'idle' && (
        <EvalProgressPanel
          steps={eval_.state.steps}
          streamedText={eval_.state.streamedText}
          status={eval_.state.status}
          error={eval_.state.error}
        />
      )}

      {/* Interrupt toast (single evaluation) */}
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

      {/* Scan interrupt modal — shown after scan completes with new jobs found */}
      {showScanModal && (
        <ScanInterruptModal
          jobs={scanner.state.newJobs}
          onEvaluateSelected={handleEvaluateFromScan}
          onDismiss={scanner.dismissScan}
        />
      )}
    </div>
  )
}
