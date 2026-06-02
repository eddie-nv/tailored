import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventType } from '@ag-ui/core'
import type { BaseEvent } from '@ag-ui/core'

const mockJobs = [
  {
    id: 'job-1',
    company: 'Acme',
    role: 'Staff Engineer',
    url: null,
    source: 'direct',
    archetype: 'Agentic',
    score: 'A',
    cvMatchPct: 87,
    evalReport: null,
    status: 'reviewed',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    resumes: [],
  },
  {
    id: 'job-2',
    company: 'Widgets Inc',
    role: 'ML Engineer',
    url: null,
    source: 'direct',
    archetype: null,
    score: null,
    cvMatchPct: null,
    evalReport: null,
    status: 'new',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    resumes: [],
  },
]

vi.mock('@tailored/db/client', () => ({
  prisma: {
    profile: { findFirst: vi.fn().mockResolvedValue(null) },
    discoveryPrefs: { findFirst: vi.fn().mockResolvedValue(null) },
    resumePrefs: { findFirst: vi.fn().mockResolvedValue(null) },
    job: {
      findMany: vi.fn().mockResolvedValue(mockJobs),
      update: vi.fn().mockImplementation(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) =>
        Promise.resolve({ ...mockJobs.find((j) => j.id === where.id)!, ...data, updatedAt: new Date() }),
      ),
      delete: vi.fn().mockResolvedValue(mockJobs[0]),
    },
  },
}))

async function collect(obs: import('rxjs').Observable<BaseEvent>): Promise<BaseEvent[]> {
  return new Promise((resolve, reject) => {
    const events: BaseEvent[] = []
    obs.subscribe({ next: (e) => events.push(e), error: reject, complete: () => resolve(events) })
  })
}

function makeInput(action: Record<string, unknown>) {
  return {
    threadId: 't1',
    runId: 'r1',
    messages: [] as never[],
    tools: [] as never[],
    context: [] as never[],
    forwardedProps: {},
    state: { action },
  }
}

describe('TrackerAgent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('emits STATE_SNAPSHOT with jobs on snapshot action', async () => {
    const { TrackerAgent } = await import('../tracker/TrackerAgent')
    const agent = new TrackerAgent()

    const events = await collect(agent.run(makeInput({ type: 'snapshot' })))

    const snap = events.find((e) => e.type === EventType.STATE_SNAPSHOT) as
      | (BaseEvent & { snapshot: { jobs: typeof mockJobs } })
      | undefined

    expect(snap).toBeDefined()
    expect(snap?.snapshot.jobs).toHaveLength(2)
    expect(snap?.snapshot.jobs[0]?.id).toBe('job-1')
  })

  it('emits STATE_SNAPSHOT when no action provided', async () => {
    const { TrackerAgent } = await import('../tracker/TrackerAgent')
    const agent = new TrackerAgent()

    const events = await collect(
      agent.run({ ...makeInput({}), state: {} }),
    )

    expect(events.some((e) => e.type === EventType.STATE_SNAPSHOT)).toBe(true)
  })

  it('emits TOOL_CALL_START → TOOL_CALL_ARGS → TOOL_CALL_END → TOOL_CALL_RESULT for updateStatus', async () => {
    const { TrackerAgent } = await import('../tracker/TrackerAgent')
    const agent = new TrackerAgent()

    const events = await collect(
      agent.run(makeInput({ type: 'updateStatus', jobId: 'job-1', status: 'applying' })),
    )

    const types = events.map((e) => e.type)
    expect(types).toContain(EventType.TOOL_CALL_START)
    expect(types).toContain(EventType.TOOL_CALL_ARGS)
    expect(types).toContain(EventType.TOOL_CALL_END)
    expect(types).toContain(EventType.TOOL_CALL_RESULT)
  })

  it('emits STATE_DELTA after updateStatus', async () => {
    const { TrackerAgent } = await import('../tracker/TrackerAgent')
    const agent = new TrackerAgent()

    const events = await collect(
      agent.run(makeInput({ type: 'updateStatus', jobId: 'job-1', status: 'applying' })),
    )

    const delta = events.find((e) => e.type === EventType.STATE_DELTA) as
      | (BaseEvent & { delta: Array<{ op: string; path: string; value: unknown }> })
      | undefined

    expect(delta).toBeDefined()
    const statusPatch = delta?.delta.find((p) => p.path.endsWith('/status'))
    expect(statusPatch?.value).toBe('applying')
  })

  it('emits STATE_DELTA after archiveJob', async () => {
    const { TrackerAgent } = await import('../tracker/TrackerAgent')
    const agent = new TrackerAgent()

    const events = await collect(
      agent.run(makeInput({ type: 'archiveJob', jobId: 'job-2' })),
    )

    const delta = events.find((e) => e.type === EventType.STATE_DELTA) as
      | (BaseEvent & { delta: Array<{ op: string; path: string; value: unknown }> })
      | undefined

    expect(delta).toBeDefined()
    const statusPatch = delta?.delta.find((p) => p.path.endsWith('/status'))
    expect(statusPatch?.value).toBe('archived')
  })

  it('emits STATE_DELTA after updateNotes', async () => {
    const { TrackerAgent } = await import('../tracker/TrackerAgent')
    const agent = new TrackerAgent()

    const events = await collect(
      agent.run(makeInput({ type: 'updateNotes', jobId: 'job-1', notes: 'Great team' })),
    )

    const delta = events.find((e) => e.type === EventType.STATE_DELTA) as
      | (BaseEvent & { delta: Array<{ op: string; path: string; value: unknown }> })
      | undefined

    expect(delta).toBeDefined()
    const notesPatch = delta?.delta.find((p) => p.path.endsWith('/notes'))
    expect(notesPatch?.value).toBe('Great team')
  })

  it('emits RUN_STARTED and RUN_FINISHED for all actions', async () => {
    const { TrackerAgent } = await import('../tracker/TrackerAgent')

    for (const action of [
      { type: 'snapshot' },
      { type: 'updateStatus', jobId: 'job-1', status: 'applied' },
      { type: 'archiveJob', jobId: 'job-1' },
      { type: 'updateNotes', jobId: 'job-1', notes: 'test' },
    ]) {
      const agent = new TrackerAgent()
      const events = await collect(agent.run(makeInput(action as Record<string, unknown>)))
      expect(events[0]?.type).toBe(EventType.RUN_STARTED)
      expect(events[events.length - 1]?.type).toBe(EventType.RUN_FINISHED)
    }
  })
})
