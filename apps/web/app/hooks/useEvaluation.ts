'use client'

import { useState, useRef, useCallback } from 'react'
import { createAgent } from '@/app/lib/createAgent'
import { EventType } from '@ag-ui/core'
import type { BaseEvent } from '@ag-ui/core'

export type EvalStep = {
  name: string
  status: 'pending' | 'active' | 'done'
}

const STEP_NAMES = [
  'archetype-detection',
  'scoring',
  'cv-match',
  'compensation-research',
  'report-generation',
] as const

export type EvalStatus = 'idle' | 'creating-job' | 'evaluating' | 'done' | 'error'

export interface InterruptData {
  id: string
  reason: string
  message: string
  metadata: { jobId: string; score: string; archetype: string; cvMatchPct: number }
}

export interface EvaluationState {
  status: EvalStatus
  steps: EvalStep[]
  streamedText: string
  interrupt: InterruptData | null
  error: string | null
  jobId: string | null
}

const initialSteps: EvalStep[] = STEP_NAMES.map((name) => ({ name, status: 'pending' }))

export function useEvaluation() {
  const [state, setState] = useState<EvaluationState>({
    status: 'idle',
    steps: initialSteps,
    streamedText: '',
    interrupt: null,
    error: null,
    jobId: null,
  })

  const abortRef = useRef<(() => void) | null>(null)

  const reset = useCallback(() => {
    abortRef.current?.()
    setState({
      status: 'idle',
      steps: initialSteps,
      streamedText: '',
      interrupt: null,
      error: null,
      jobId: null,
    })
  }, [])

  const evaluate = useCallback(async (input: string) => {
    abortRef.current?.()

    setState({
      status: 'creating-job',
      steps: initialSteps,
      streamedText: '',
      interrupt: null,
      error: null,
      jobId: null,
    })

    // Step 1: Create the job row
    let jobId: string
    try {
      const isUrl = input.startsWith('http://') || input.startsWith('https://')
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isUrl ? { url: input } : { description: input }),
      })
      if (!res.ok) throw new Error('Failed to create job')
      const data = (await res.json()) as { success: boolean; data: { id: string } }
      jobId = data.data.id
    } catch (err) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to create job',
      }))
      return
    }

    setState((s) => ({ ...s, status: 'evaluating', jobId }))

    // Step 2: Stream evaluation
    const threadId = crypto.randomUUID()
    const agent = createAgent({ url: '/api/agents/evaluate', threadId })

    const obs$ = agent.run({
      threadId,
      runId: crypto.randomUUID(),
      messages: [],
      tools: [],
      context: [],
      forwardedProps: {},
      state: { pendingJobId: jobId, jobDescription: input },
    })

    let stopped = false
    const sub = obs$.subscribe({
      next(event: BaseEvent) {
        const e = event as BaseEvent & Record<string, unknown>

        if (e.type === EventType.STEP_STARTED) {
          const stepName = e.stepName as string
          setState((s) => ({
            ...s,
            steps: s.steps.map((st) =>
              st.name === stepName ? { ...st, status: 'active' } : st,
            ),
          }))
        }

        if (e.type === EventType.STEP_FINISHED) {
          const stepName = e.stepName as string
          setState((s) => ({
            ...s,
            steps: s.steps.map((st) =>
              st.name === stepName ? { ...st, status: 'done' } : st,
            ),
          }))
        }

        if (e.type === EventType.TEXT_MESSAGE_CONTENT) {
          const delta = e.delta as string
          setState((s) => ({ ...s, streamedText: s.streamedText + delta }))
        }

        if (e.type === EventType.RUN_ERROR) {
          setState((s) => ({
            ...s,
            status: 'error',
            error: (e.message as string) || 'Evaluation failed',
          }))
        }

        if (e.type === EventType.RUN_FINISHED) {
          const outcome = e.outcome as
            | {
                type: 'interrupt'
                interrupts: Array<{
                  id: string
                  reason: string
                  message: string
                  metadata: Record<string, unknown>
                }>
              }
            | undefined

          const interrupt =
            outcome?.type === 'interrupt' && outcome.interrupts[0]
              ? (outcome.interrupts[0] as InterruptData)
              : null

          setState((s) => ({
            ...s,
            status: 'done',
            steps: s.steps.map((st) => ({ ...st, status: 'done' as const })),
            interrupt,
          }))
        }
      },
      error(err: unknown) {
        if (!stopped) {
          setState((s) => ({
            ...s,
            status: 'error',
            error: err instanceof Error ? err.message : 'Stream error',
          }))
        }
      },
    })

    abortRef.current = () => {
      stopped = true
      sub.unsubscribe()
    }
  }, [])

  const dismissInterrupt = useCallback(() => {
    setState((s) => ({ ...s, interrupt: null }))
  }, [])

  return { state, evaluate, reset, dismissInterrupt }
}
