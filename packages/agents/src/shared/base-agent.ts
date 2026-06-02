import { AbstractAgent } from '@ag-ui/client'
import { EventType } from '@ag-ui/core'
import type { RunAgentInput, BaseEvent, RunFinishedOutcome } from '@ag-ui/core'
import { Observable } from 'rxjs'
import { randomUUID } from 'crypto'
import { emitRunError, withAbort } from './errors'

export abstract class BaseAgent extends AbstractAgent {
  private abortController: AbortController | null = null
  protected runOutcome: RunFinishedOutcome | undefined

  protected abstract runSteps(
    input: RunAgentInput,
    signal: AbortSignal,
  ): AsyncGenerator<BaseEvent>

  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable<BaseEvent>((subscriber) => {
      this.abortController = new AbortController()
      const { signal } = this.abortController
      const runId = input.runId ?? randomUUID()
      const threadId = input.threadId
      this.runOutcome = undefined

      const execute = async () => {
        subscriber.next({ type: EventType.RUN_STARTED, threadId, runId } as BaseEvent)
        try {
          for await (const event of withAbort(signal, this.runSteps(input, signal))) {
            subscriber.next(event)
          }
          if (!signal.aborted) {
            subscriber.next({
              type: EventType.RUN_FINISHED,
              threadId,
              runId,
              ...(this.runOutcome ? { outcome: this.runOutcome } : {}),
            } as BaseEvent)
          }
        } catch (err) {
          emitRunError(
            subscriber,
            err instanceof Error ? err.message : 'Unexpected agent error',
          )
          subscriber.next({ type: EventType.RUN_FINISHED, threadId, runId } as BaseEvent)
        } finally {
          subscriber.complete()
        }
      }

      void execute()

      return () => {
        this.abortController?.abort()
      }
    })
  }
}
