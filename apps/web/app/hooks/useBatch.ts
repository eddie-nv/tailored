'use client'

import { useState, useRef, useCallback } from 'react'
import { HttpAgent } from '@ag-ui/client'
import { EventType } from '@ag-ui/core'
import type { BaseEvent } from '@ag-ui/core'

export type BatchStatus = 'idle' | 'running' | 'done' | 'error'

export interface BatchState {
  status: BatchStatus
  total: number
  completed: number
  error: string | null
}

export function useBatch(
  onStepChange: (jobId: string, stepName: string | null) => void,
  onRefresh: () => void,
) {
  const [state, setState] = useState<BatchState>({
    status: 'idle',
    total: 0,
    completed: 0,
    error: null,
  })

  const abortRef = useRef<(() => void) | null>(null)

  const runBatch = useCallback(
    async (jobIds: string[]) => {
      abortRef.current?.()

      setState({ status: 'running', total: jobIds.length, completed: 0, error: null })

      const threadId = crypto.randomUUID()
      const agent = new HttpAgent({ url: '/api/agents/batch', threadId })

      const obs$ = agent.run({
        threadId,
        runId: crypto.randomUUID(),
        messages: [],
        tools: [],
        context: [],
        forwardedProps: {},
        state: { batchJobIds: jobIds },
      })

      const sub = obs$.subscribe({
        next(event: BaseEvent) {
          const e = event as BaseEvent & Record<string, unknown>

          if (e.type === EventType.CUSTOM) {
            const name = e['name'] as string
            const value = e['value'] as Record<string, unknown>

            if (name === 'job-step-started') {
              onStepChange(value['jobId'] as string, value['stepName'] as string)
            } else if (name === 'job-eval-finished' || name === 'job-eval-error') {
              onStepChange(value['jobId'] as string, null)
              setState((s) => ({ ...s, completed: s.completed + 1 }))
            }
          }

          if (e.type === EventType.RUN_FINISHED) {
            setState((s) => ({ ...s, status: 'done' }))
            onRefresh()
          }

          if (e.type === EventType.RUN_ERROR) {
            setState((s) => ({
              ...s,
              status: 'error',
              error: (e['message'] as string) ?? 'Batch evaluation failed',
            }))
          }
        },
        error(err: unknown) {
          setState((s) => ({
            ...s,
            status: 'error',
            error: err instanceof Error ? err.message : 'Network error',
          }))
        },
      })

      abortRef.current = () => sub.unsubscribe()
    },
    [onStepChange, onRefresh],
  )

  const cancel = useCallback(() => {
    abortRef.current?.()
    setState((s) => ({ ...s, status: 'idle' }))
  }, [])

  return { state, runBatch, cancel }
}
