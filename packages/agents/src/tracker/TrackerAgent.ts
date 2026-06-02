import { EventType } from '@ag-ui/core'
import type { RunAgentInput, BaseEvent } from '@ag-ui/core'
import { prisma } from '@tailored/db/client'
import { BaseAgent } from '../shared/base-agent'
import { loadAppState } from '../shared/state'
import { randomUUID } from 'crypto'

type TrackerAction =
  | { type: 'snapshot' }
  | { type: 'updateStatus'; jobId: string; status: string }
  | { type: 'archiveJob'; jobId: string }
  | { type: 'deleteJob'; jobId: string }
  | { type: 'updateNotes'; jobId: string; notes: string }

export class TrackerAgent extends BaseAgent {
  protected async *runSteps(
    input: RunAgentInput,
    _signal: AbortSignal,
  ): AsyncGenerator<BaseEvent> {
    const action = (input.state as Record<string, unknown> | undefined)
      ?.action as TrackerAction | undefined

    if (!action || action.type === 'snapshot') {
      yield* this.emitSnapshot()
      return
    }

    yield* this.emitMutation(action)
  }

  private async *emitSnapshot(): AsyncGenerator<BaseEvent> {
    const appState = await loadAppState(prisma)
    yield { type: EventType.STATE_SNAPSHOT, snapshot: appState } as BaseEvent
  }

  private async *emitMutation(action: TrackerAction): AsyncGenerator<BaseEvent> {
    if (action.type === 'snapshot') return

    const toolCallId = randomUUID()
    const toolName = action.type

    yield {
      type: EventType.TOOL_CALL_START,
      toolCallId,
      toolCallName: toolName,
    } as BaseEvent

    yield {
      type: EventType.TOOL_CALL_ARGS,
      toolCallId,
      delta: JSON.stringify(action),
    } as BaseEvent

    yield { type: EventType.TOOL_CALL_END, toolCallId } as BaseEvent

    // Execute the mutation and build RFC 6902 delta
    const patches = await executeMutation(action)

    yield {
      type: EventType.TOOL_CALL_RESULT,
      toolCallId,
      content: 'ok',
    } as BaseEvent

    if (patches.length > 0) {
      yield { type: EventType.STATE_DELTA, delta: patches } as BaseEvent
    }
  }
}

type RfcPatch = { op: 'replace' | 'remove' | 'add'; path: string; value?: unknown }

async function executeMutation(action: Exclude<TrackerAction, { type: 'snapshot' }>): Promise<RfcPatch[]> {
  switch (action.type) {
    case 'updateStatus': {
      const updated = await prisma.job.update({
        where: { id: action.jobId },
        data: { status: action.status },
      })
      const idx = await getJobIndex(action.jobId)
      if (idx === -1) return []
      return [
        { op: 'replace', path: `/jobs/${idx}/status`, value: updated.status },
        { op: 'replace', path: `/jobs/${idx}/updatedAt`, value: updated.updatedAt.toISOString() },
      ]
    }

    case 'archiveJob': {
      const updated = await prisma.job.update({
        where: { id: action.jobId },
        data: { status: 'archived' },
      })
      const idx = await getJobIndex(action.jobId)
      if (idx === -1) return []
      return [
        { op: 'replace', path: `/jobs/${idx}/status`, value: updated.status },
      ]
    }

    case 'deleteJob': {
      await prisma.job.delete({ where: { id: action.jobId } })
      const state = await loadAppState(prisma)
      // Return a full snapshot path instead of a remove-by-id patch
      // The frontend will reconcile by filtering by id on the remove signal
      return [{ op: 'remove', path: `/jobs`, value: state.jobs }]
    }

    case 'updateNotes': {
      const updated = await prisma.job.update({
        where: { id: action.jobId },
        data: { notes: action.notes },
      })
      const idx = await getJobIndex(action.jobId)
      if (idx === -1) return []
      return [
        { op: 'replace', path: `/jobs/${idx}/notes`, value: updated.notes },
      ]
    }
  }
}

async function getJobIndex(jobId: string): Promise<number> {
  const jobs = await prisma.job.findMany({
    select: { id: true },
    orderBy: { createdAt: 'desc' },
  })
  return jobs.findIndex((j) => j.id === jobId)
}
