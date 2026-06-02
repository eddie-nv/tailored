import { EventType } from '@ag-ui/core'
import type { Subscriber } from 'rxjs'
import type { BaseEvent } from '@ag-ui/core'

export function emitRunError(
  subscriber: Subscriber<BaseEvent>,
  message: string,
  code?: string,
): void {
  subscriber.next({
    type: EventType.RUN_ERROR,
    message,
    code,
  } as BaseEvent)
}

export async function* withAbort<T>(
  signal: AbortSignal,
  gen: AsyncGenerator<T>,
): AsyncGenerator<T> {
  try {
    for await (const value of gen) {
      if (signal.aborted) return
      yield value
    }
  } finally {
    await gen.return(undefined)
  }
}
