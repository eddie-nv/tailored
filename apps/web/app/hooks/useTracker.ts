'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createAgent } from '@/app/lib/createAgent'
import { EventType } from '@ag-ui/core'
import type { BaseEvent } from '@ag-ui/core'
import type { JobWithResumes } from '@tailored/db'

type RfcPatch = { op: 'replace' | 'remove' | 'add'; path: string; value?: unknown }

function applyPatches(jobs: JobWithResumes[], patches: RfcPatch[]): JobWithResumes[] {
  return patches.reduce((acc, patch) => {
    // Handle full jobs array replacement (used by deleteJob)
    if (patch.path === '/jobs' && patch.op === 'remove' && Array.isArray(patch.value)) {
      return patch.value as JobWithResumes[]
    }

    // Handle /jobs/N/resumes/M add (CVAgent STATE_DELTA)
    const resumeMatch = /^\/jobs\/(\d+)\/resumes\/(\d+)$/.exec(patch.path)
    if (resumeMatch && patch.op === 'add') {
      const idx = parseInt(resumeMatch[1]!, 10)
      return acc.map((job, i) => {
        if (i !== idx) return job
        return {
          ...job,
          resumes: [...job.resumes, patch.value as JobWithResumes['resumes'][number]],
        }
      })
    }

    // Handle /jobs/N/field replace
    const match = /^\/jobs\/(\d+)\/(\w+)$/.exec(patch.path)
    if (!match || patch.op !== 'replace') return acc
    const idx = parseInt(match[1]!, 10)
    const field = match[2]!
    return acc.map((job, i) => (i === idx ? { ...job, [field]: patch.value } : job))
  }, jobs)
}

type TrackerAction =
  | { type: 'snapshot' }
  | { type: 'updateStatus'; jobId: string; status: string }
  | { type: 'archiveJob'; jobId: string }
  | { type: 'deleteJob'; jobId: string }
  | { type: 'updateNotes'; jobId: string; notes: string }

export interface ActiveEvalStep {
  jobId: string
  stepName: string
}

export interface TrackerState {
  jobs: JobWithResumes[]
  isLoading: boolean
  error: string | null
  showArchived: boolean
  selectedIds: Set<string>
  activeEvalSteps: Map<string, string>  // jobId → active step name
}

export function useTracker() {
  const [state, setState] = useState<TrackerState>({
    jobs: [],
    isLoading: true,
    error: null,
    showArchived: false,
    selectedIds: new Set(),
    activeEvalSteps: new Map(),
  })

  const threadId = useRef(crypto.randomUUID())
  const abortRef = useRef<(() => void) | null>(null)

  const runTrackerAction = useCallback(
    (action: TrackerAction, onDelta?: (patches: RfcPatch[]) => void): Promise<void> => {
      return new Promise((resolve, reject) => {
        const agent = createAgent({
          url: '/api/agents/tracker',
          threadId: threadId.current,
        })

        const sub = agent
          .run({
            threadId: threadId.current,
            runId: crypto.randomUUID(),
            messages: [],
            tools: [],
            context: [],
            forwardedProps: {},
            state: { action },
          })
          .subscribe({
            next(event: BaseEvent) {
              const e = event as BaseEvent & Record<string, unknown>

              if (e.type === EventType.STATE_SNAPSHOT) {
                const snapshot = e.snapshot as { jobs?: JobWithResumes[] } | undefined
                setState((s) => ({
                  ...s,
                  jobs: snapshot?.jobs ?? [],
                  isLoading: false,
                  error: null,
                }))
              }

              if (e.type === EventType.STATE_DELTA) {
                const patches = (e.delta ?? []) as RfcPatch[]
                setState((s) => ({ ...s, jobs: applyPatches(s.jobs, patches) }))
                onDelta?.(patches)
              }

              if (e.type === EventType.RUN_ERROR) {
                setState((s) => ({
                  ...s,
                  isLoading: false,
                  error: (e.message as string) ?? 'Tracker error',
                }))
                reject(new Error((e.message as string) ?? 'Tracker error'))
              }
            },
            error(err) {
              setState((s) => ({
                ...s,
                isLoading: false,
                error: err instanceof Error ? err.message : 'Network error',
              }))
              reject(err)
            },
            complete: () => resolve(),
          })

        abortRef.current = () => sub.unsubscribe()
      })
    },
    [],
  )

  // Load snapshot on mount
  useEffect(() => {
    void runTrackerAction({ type: 'snapshot' })
    return () => abortRef.current?.()
  }, [runTrackerAction])

  // ── Mutations ──────────────────────────────────────────────────────────────

  const updateStatus = useCallback(
    async (jobId: string, status: string) => {
      // Optimistic update
      setState((s) => ({
        ...s,
        jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, status } : j)),
      }))
      try {
        await runTrackerAction({ type: 'updateStatus', jobId, status })
      } catch {
        // rollback via re-snapshot
        void runTrackerAction({ type: 'snapshot' })
      }
    },
    [runTrackerAction],
  )

  const archiveJob = useCallback(
    async (jobId: string) => {
      setState((s) => ({
        ...s,
        jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, status: 'archived' } : j)),
        selectedIds: new Set([...s.selectedIds].filter((id) => id !== jobId)),
      }))
      try {
        await runTrackerAction({ type: 'archiveJob', jobId })
      } catch {
        void runTrackerAction({ type: 'snapshot' })
      }
    },
    [runTrackerAction],
  )

  const deleteJob = useCallback(
    async (jobId: string) => {
      setState((s) => ({
        ...s,
        jobs: s.jobs.filter((j) => j.id !== jobId),
        selectedIds: new Set([...s.selectedIds].filter((id) => id !== jobId)),
      }))
      try {
        await runTrackerAction({ type: 'deleteJob', jobId })
      } catch {
        void runTrackerAction({ type: 'snapshot' })
      }
    },
    [runTrackerAction],
  )

  const updateNotes = useCallback(
    async (jobId: string, notes: string) => {
      setState((s) => ({
        ...s,
        jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, notes } : j)),
      }))
      try {
        await runTrackerAction({ type: 'updateNotes', jobId, notes })
      } catch {
        void runTrackerAction({ type: 'snapshot' })
      }
    },
    [runTrackerAction],
  )

  // Called by ResultsTab when EvaluationAgent finishes
  const upsertJob = useCallback((update: Partial<JobWithResumes> & { id: string }) => {
    setState((s) => {
      const exists = s.jobs.some((j) => j.id === update.id)
      if (exists) {
        return {
          ...s,
          jobs: s.jobs.map((j) => (j.id === update.id ? { ...j, ...update } : j)),
        }
      }
      // New job not yet in list — re-snapshot will catch it
      return s
    })
  }, [])

  const setShowArchived = useCallback((show: boolean) => {
    setState((s) => ({ ...s, showArchived: show }))
  }, [])

  const toggleSelect = useCallback((id: string) => {
    setState((s) => {
      const next = new Set(s.selectedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { ...s, selectedIds: next }
    })
  }, [])

  const toggleSelectAll = useCallback((visibleIds: string[]) => {
    setState((s) => {
      const allSelected = visibleIds.every((id) => s.selectedIds.has(id))
      return {
        ...s,
        selectedIds: allSelected ? new Set() : new Set(visibleIds),
      }
    })
  }, [])

  const setActiveEvalStep = useCallback((jobId: string, stepName: string | null) => {
    setState((s) => {
      const next = new Map(s.activeEvalSteps)
      if (stepName) next.set(jobId, stepName)
      else next.delete(jobId)
      return { ...s, activeEvalSteps: next }
    })
  }, [])

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, isLoading: true }))
    return runTrackerAction({ type: 'snapshot' })
  }, [runTrackerAction])

  const visibleJobs = state.showArchived
    ? state.jobs
    : state.jobs.filter((j) => j.status !== 'archived')

  return {
    state,
    visibleJobs,
    updateStatus,
    archiveJob,
    deleteJob,
    updateNotes,
    upsertJob,
    setShowArchived,
    toggleSelect,
    toggleSelectAll,
    setActiveEvalStep,
    refresh,
  }
}
