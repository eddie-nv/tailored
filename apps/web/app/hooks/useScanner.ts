'use client'

import { useState, useRef, useCallback } from 'react'
import { HttpAgent } from '@ag-ui/client'
import { EventType } from '@ag-ui/core'
import type { BaseEvent } from '@ag-ui/core'

export interface NewJob {
  id: string
  company: string
  role: string
  url: string | null
}

export interface PlatformEntry {
  name: string
  done: boolean
}

export type ScanStatus = 'idle' | 'scanning' | 'done' | 'error'

export interface ScanState {
  status: ScanStatus
  total: number
  done: number
  found: number
  platforms: PlatformEntry[]
  newJobs: NewJob[]
  error: string | null
}

const INITIAL_STATE: ScanState = {
  status: 'idle',
  total: 0,
  done: 0,
  found: 0,
  platforms: [],
  newJobs: [],
  error: null,
}

export function useScanner(onRefresh: () => void) {
  const [state, setState] = useState<ScanState>(INITIAL_STATE)
  const abortRef = useRef<(() => void) | null>(null)

  const scan = useCallback(() => {
    abortRef.current?.()

    setState({
      ...INITIAL_STATE,
      status: 'scanning',
    })

    const threadId = crypto.randomUUID()
    const agent = new HttpAgent({ url: '/api/agents/scan', threadId })

    const obs$ = agent.run({
      threadId,
      runId: crypto.randomUUID(),
      messages: [],
      tools: [],
      context: [],
      forwardedProps: {},
      state: { action: 'scan' },
    })

    let stopped = false
    const sub = obs$.subscribe({
      next(event: BaseEvent) {
        const e = event as BaseEvent & Record<string, unknown>

        if (e.type === EventType.STEP_STARTED) {
          const stepName = e.stepName as string
          const platformName = stepName.replace(/^scanning-/, '')
          setState((s) => ({
            ...s,
            platforms: s.platforms.some((p) => p.name === platformName)
              ? s.platforms
              : [...s.platforms, { name: platformName, done: false }],
          }))
        }

        if (e.type === EventType.STEP_FINISHED) {
          const stepName = e.stepName as string
          const platformName = stepName.replace(/^scanning-/, '')
          setState((s) => ({
            ...s,
            platforms: s.platforms.map((p) =>
              p.name === platformName ? { ...p, done: true } : p,
            ),
          }))
        }

        if (e.type === EventType.CUSTOM) {
          const name = e.name as string
          const value = e.value as Record<string, unknown>

          if (name === 'scan-progress-init') {
            setState((s) => ({
              ...s,
              total: (value.total as number) ?? 0,
              done: 0,
              found: 0,
            }))
          }

          if (name === 'scan-progress-update') {
            setState((s) => ({
              ...s,
              done: (value.done as number) ?? s.done,
              found: (value.found as number) ?? s.found,
            }))
          }
        }

        if (e.type === EventType.STATE_DELTA) {
          onRefresh()
        }

        if (e.type === EventType.RUN_ERROR) {
          setState((s) => ({
            ...s,
            status: 'error',
            error: (e.message as string) || 'Scan failed',
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

          const firstInterrupt =
            outcome?.type === 'interrupt' ? outcome.interrupts[0] : undefined

          const newJobs =
            firstInterrupt?.reason === 'select-jobs-to-evaluate'
              ? ((firstInterrupt.metadata?.newJobs ?? []) as NewJob[])
              : []

          if (!stopped) {
            setState((s) => ({
              ...s,
              status: 'done',
              newJobs,
              platforms: s.platforms.map((p) => ({ ...p, done: true })),
            }))
          }
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
  }, [onRefresh])

  const confirmScan = useCallback(
    (selectedJobIds: string[]) => {
      // M8 will wire batch evaluation here
      // For now, refresh the tracker to reflect the new jobs
      if (selectedJobIds.length > 0) {
        onRefresh()
      }
      setState((s) => ({ ...s, status: 'idle', newJobs: [] }))
    },
    [onRefresh],
  )

  const dismissScan = useCallback(() => {
    abortRef.current?.()
    setState(INITIAL_STATE)
  }, [])

  return { state, scan, confirmScan, dismissScan }
}
