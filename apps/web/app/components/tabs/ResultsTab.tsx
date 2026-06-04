'use client'

import { useCallback, useEffect, useRef } from 'react'
import { Box, Center, Flex, Text, Group, Loader, UnstyledButton } from '@mantine/core'
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
import type { JobWithResumes } from '@tailored/db'

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
      } as Partial<JobWithResumes> & { id: string })
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
    <Flex direction="column" style={{ height: '100%', overflow: 'hidden' }}>
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
        <Group
          gap="xs"
          p="6px 12px"
          fz="xs"
          c="var(--accent)"
          style={{
            background: 'rgba(255, 56, 92, 0.08)',
            borderBottom: '1px solid rgba(255, 56, 92, 0.2)',
            flexShrink: 0,
          }}
        >
          <Loader size={12} color="var(--accent)" style={{ flexShrink: 0 }} />
          Evaluating {batch.state.completed} of {batch.state.total} jobs…
        </Group>
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
        <Center role="status" aria-label="Loading jobs" style={{ flex: 1 }}>
          <Group gap="xs">
            <Loader size={16} color="var(--accent)" />
            <Text size="sm" c="dimmed">Loading jobs…</Text>
          </Group>
        </Center>
      )}

      {/* Error state */}
      {!tracker.state.isLoading && tracker.state.error && (
        <Center role="alert" style={{ flex: 1 }}>
          <Group gap="xs">
            <Text size="sm" c="red">✕</Text>
            <Text size="sm" c="red">{tracker.state.error}</Text>
            <UnstyledButton type="button" onClick={tracker.refresh} fz="xs" c="#ef4444" ml={4} style={{ textDecoration: 'underline' }}>
              Retry
            </UnstyledButton>
          </Group>
        </Center>
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
          onUpdateStatus={tracker.updateStatus}
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
    </Flex>
  )
}
