import { EventType } from '@ag-ui/core'
import type { RunAgentInput, BaseEvent } from '@ag-ui/core'
import { randomUUID } from 'crypto'
import { prisma } from '@tailored/db/client'
import { BaseAgent } from '../shared/base-agent'
import { EvaluationAgent } from '../evaluation/EvaluationAgent'

function stepStarted(stepName: string): BaseEvent {
  return { type: EventType.STEP_STARTED, stepName } as BaseEvent
}

function stepFinished(stepName: string): BaseEvent {
  return { type: EventType.STEP_FINISHED, stepName } as BaseEvent
}

class Semaphore {
  private queue: Array<() => void> = []
  private running = 0

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.max) {
      this.running++
      return
    }
    return new Promise((resolve) => this.queue.push(resolve))
  }

  release(): void {
    const next = this.queue.shift()
    if (next) {
      next()
    } else {
      this.running--
    }
  }
}

export class BatchAgent extends BaseAgent {
  protected async *runSteps(
    input: RunAgentInput,
    signal: AbortSignal,
  ): AsyncGenerator<BaseEvent> {
    const state = input.state as { batchJobIds?: string[] } | undefined
    const jobIds = state?.batchJobIds ?? []

    if (jobIds.length === 0) return

    yield stepStarted('batch-init')

    const CONCURRENCY = parseInt(process.env['BATCH_CONCURRENCY'] ?? '5', 10)
    const sem = new Semaphore(CONCURRENCY)

    // Channel: events flow from concurrent jobs to this generator
    const buffer: BaseEvent[] = []
    let pending = jobIds.length
    let resolveNext: (() => void) | null = null

    const push = (event: BaseEvent) => {
      buffer.push(event)
      resolveNext?.()
      resolveNext = null
    }

    const markDone = () => {
      pending--
      resolveNext?.()
      resolveNext = null
    }

    // Fetch job descriptions from DB upfront
    const jobs = await prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, url: true, notes: true },
    })
    type JobRow = { id: string; url: string | null; notes: string | null }
    const jobMap = new Map((jobs as JobRow[]).map((j) => [j.id, j]))

    // Launch all jobs concurrently
    for (const jobId of jobIds) {
      void (async () => {
        await sem.acquire()
        if (signal.aborted) {
          sem.release()
          markDone()
          return
        }

        try {
          push({
            type: EventType.CUSTOM,
            name: 'job-eval-started',
            value: { jobId },
          } as BaseEvent)

          const job = jobMap.get(jobId)
          const jobDescription = job?.url ?? job?.notes ?? ''

          const subAgent = new EvaluationAgent()
          const obs$ = subAgent.run({
            ...input,
            runId: randomUUID(),
            state: { pendingJobId: jobId, jobDescription },
          })

          await new Promise<void>((resolve, reject) => {
            obs$.subscribe({
              next(event: BaseEvent) {
                const e = event as BaseEvent & Record<string, unknown>

                if (e.type === EventType.STEP_STARTED) {
                  push({
                    type: EventType.CUSTOM,
                    name: 'job-step-started',
                    value: { jobId, stepName: e['stepName'] as string },
                  } as BaseEvent)
                } else if (e.type === EventType.STEP_FINISHED) {
                  push({
                    type: EventType.CUSTOM,
                    name: 'job-step-finished',
                    value: { jobId, stepName: e['stepName'] as string },
                  } as BaseEvent)
                } else if (e.type === EventType.STATE_DELTA) {
                  push(event)
                } else if (
                  e.type === EventType.CUSTOM &&
                  (e as Record<string, unknown>)['name'] === 'job-evaluated'
                ) {
                  const val = (e as Record<string, unknown>)['value'] as {
                    score?: string
                  }
                  push({
                    type: EventType.CUSTOM,
                    name: 'job-eval-finished',
                    value: { jobId, score: val?.score },
                  } as BaseEvent)
                }
              },
              error: reject,
              complete: resolve,
            })
          })
        } catch (err) {
          push({
            type: EventType.CUSTOM,
            name: 'job-eval-error',
            value: {
              jobId,
              error: err instanceof Error ? err.message : 'Unknown error',
            },
          } as BaseEvent)
        } finally {
          sem.release()
          markDone()
        }
      })()
    }

    // Yield events as they arrive
    while (pending > 0 || buffer.length > 0) {
      while (buffer.length > 0) {
        yield buffer.shift()!
      }
      if (pending > 0) {
        await new Promise<void>((resolve) => {
          resolveNext = resolve
        })
      }
    }

    yield stepFinished('batch-init')
  }
}
