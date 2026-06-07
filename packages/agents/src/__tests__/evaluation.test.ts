import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventType } from '@ag-ui/core'
import type { BaseEvent } from '@ag-ui/core'

// Hoist references so they're accessible inside vi.mock factories AND in tests
const { mockCreate, mockStream, mockPrisma } = vi.hoisted(() => {
  const mockCreate = vi.fn()
  const mockStream = vi.fn()
  const mockPrisma = {
    profile: { findFirst: vi.fn() },
    discoveryPrefs: { findFirst: vi.fn() },
    resumePrefs: { findFirst: vi.fn() },
    job: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  }
  return { mockCreate, mockStream, mockPrisma }
})

vi.mock('@tailored/db/client', () => ({ prisma: mockPrisma }))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate, stream: mockStream },
  })),
}))

function setupDefaultMocks() {
  mockPrisma.profile.findFirst.mockResolvedValue(null)
  mockPrisma.discoveryPrefs.findFirst.mockResolvedValue(null)
  mockPrisma.resumePrefs.findFirst.mockResolvedValue(null)
  mockPrisma.job.findMany.mockResolvedValue([])
  mockPrisma.job.findUnique.mockResolvedValue(null)
  mockPrisma.job.update.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({ id: 'job-1', ...data }),
  )

  mockCreate.mockImplementation(async ({ system }: { system: string }) => {
    if (system.includes('job classification')) {
      return { content: [{ type: 'text', text: '{"archetype":"Agentic","company":"Acme Corp","role":"Staff Engineer"}' }] }
    }
    if (system.includes('job fit evaluator')) {
      return { content: [{ type: 'text', text: '{"scores":{"role_seniority_alignment":8,"tech_stack_match":7,"industry_relevance":8,"compensation_fit":7,"location_compatibility":9,"company_stage_fit":7,"growth_potential":8,"work_life_signals":7,"team_structure":7,"jd_quality":8},"total":76}' }] }
    }
    if (system.includes('CV-to-job')) {
      return { content: [{ type: 'text', text: '{"cvMatchPct":72,"matched_requirements":["TypeScript","React","Node.js"],"gaps":["Kubernetes","Terraform"]}' }] }
    }
    if (system.includes('compensation')) {
      return { content: [{ type: 'text', text: '{"explicit_range":null,"estimated_range":"$180k-$250k","equity_signals":"0.1-0.5% options","benefits_highlights":["Health","401k"],"market_notes":"Competitive for SF"}' }] }
    }
    return { content: [{ type: 'text', text: '{}' }] }
  })

  mockStream.mockImplementation(() => {
    async function* fakeStream() {
      yield { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }
      yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: '## Role Summary\nA great role.' } }
      yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: '\n## CV Match (72%)\nGood match.' } }
      yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: '\n## Level Strategy\nStrong fit.' } }
      yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: '\n## Compensation\nCompetitive.' } }
      yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: '\n## Personalization\nHighlight AI experience.' } }
      yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: '\n## Interview Prep\nFocus on system design.' } }
      yield { type: 'content_block_stop', index: 0 }
      yield { type: 'message_stop' }
    }
    const gen = fakeStream()
    return { [Symbol.asyncIterator]: () => gen }
  })
}

async function collect(obs: import('rxjs').Observable<BaseEvent>): Promise<BaseEvent[]> {
  return new Promise((resolve, reject) => {
    const events: BaseEvent[] = []
    obs.subscribe({ next: (e) => events.push(e), error: reject, complete: () => resolve(events) })
  })
}

function runAgent(threadId: string, runId: string, jobId: string) {
  return async () => {
    const { EvaluationAgent } = await import('../evaluation/EvaluationAgent.js')
    const agent = new EvaluationAgent()
    return collect(
      agent.run({
        threadId,
        runId,
        messages: [],
        tools: [],
        context: [],
        forwardedProps: {},
        state: { pendingJobId: jobId, jobDescription: 'Senior engineer role at Acme.' },
      }),
    )
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  setupDefaultMocks()
})

describe('EvaluationAgent', () => {
  it('emits RUN_STARTED and RUN_FINISHED', async () => {
    const events = await runAgent('t1', 'r1', 'job-1')()
    expect(events[0]?.type).toBe(EventType.RUN_STARTED)
    expect(events[events.length - 1]?.type).toBe(EventType.RUN_FINISHED)
  })

  it('emits all 5 STEP_STARTED events', async () => {
    const events = await runAgent('t2', 'r2', 'job-2')()
    const stepNames = events
      .filter((e) => e.type === EventType.STEP_STARTED)
      .map((e) => (e as BaseEvent & { stepName: string }).stepName)

    expect(stepNames).toContain('archetype-detection')
    expect(stepNames).toContain('scoring')
    expect(stepNames).toContain('cv-match')
    expect(stepNames).toContain('compensation-research')
    expect(stepNames).toContain('report-generation')
    expect(stepNames).toHaveLength(5)
  })

  it('emits all 5 STEP_FINISHED events', async () => {
    const events = await runAgent('t3', 'r3', 'job-3')()
    expect(events.filter((e) => e.type === EventType.STEP_FINISHED)).toHaveLength(5)
  })

  it('emits TEXT_MESSAGE_CONTENT chunks during report generation', async () => {
    const events = await runAgent('t4', 'r4', 'job-4')()
    expect(events.filter((e) => e.type === EventType.TEXT_MESSAGE_CONTENT).length).toBeGreaterThan(0)
  })

  it('emits STATE_DELTA with job patches', async () => {
    const events = await runAgent('t5', 'r5', 'job-5')()
    const delta = events.find((e) => e.type === EventType.STATE_DELTA)
    if (delta) {
      expect(Array.isArray((delta as BaseEvent & { delta: unknown[] }).delta)).toBe(true)
    }
  })

  it('emits CUSTOM job-evaluated event', async () => {
    const events = await runAgent('t6', 'r6', 'job-6')()
    const custom = events.find(
      (e) =>
        e.type === EventType.CUSTOM &&
        (e as BaseEvent & { name: string }).name === 'job-evaluated',
    ) as (BaseEvent & { value: { jobId: string; score: string; archetype: string; cvMatchPct: number } }) | undefined

    expect(custom).toBeDefined()
    expect(custom?.value.jobId).toBe('job-6')
    expect(custom?.value.archetype).toBe('Agentic')
    expect(typeof custom?.value.score).toBe('string')
    expect(typeof custom?.value.cvMatchPct).toBe('number')
  })

  it('emits RUN_FINISHED with interrupt outcome', async () => {
    const events = await runAgent('t7', 'r7', 'job-7')()
    const finished = events[events.length - 1] as BaseEvent & {
      outcome?: { type: string; interrupts: unknown[] }
    }
    expect(finished?.type).toBe(EventType.RUN_FINISHED)
    expect(finished?.outcome?.type).toBe('interrupt')
    expect(finished?.outcome?.interrupts).toHaveLength(1)
  })

  it('emits RUN_ERROR when pendingJobId is missing', async () => {
    const { EvaluationAgent } = await import('../evaluation/EvaluationAgent.js')
    const agent = new EvaluationAgent()
    const events = await collect(
      agent.run({ threadId: 't8', runId: 'r8', messages: [], tools: [], context: [], forwardedProps: {}, state: {} }),
    )
    expect(events.find((e) => e.type === EventType.RUN_ERROR)).toBeDefined()
  })
})

describe('EvaluationAgent — proof points wiring', () => {
  const profileWithProofPoints = {
    id: 'profile-1',
    cv: 'Senior engineer with 10 years experience.',
    proofPoints: JSON.stringify([
      { name: 'Project Alpha', url: 'https://alpha.example.com', heroMetric: '↑ 40% DAU in 6 weeks' },
      { name: 'OSS Tool', url: 'https://github.com/x/tool', heroMetric: '2K GitHub stars' },
    ]),
    scoringWeights: null,
    roleTargets: null,
    location: 'Remote',
    workType: 'remote',
    salaryMin: null,
    salaryMax: null,
    headline: null,
    narrative: null,
    identity: null,
    pitchAngle: null,
    cvOutputFormat: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  it('includes proof point names and hero metrics in the CV match prompt', async () => {
    mockPrisma.profile.findFirst
      .mockResolvedValueOnce(profileWithProofPoints)
      .mockResolvedValueOnce(null)

    await runAgent('pp1', 'rpp1', 'job-pp1')()

    const cvMatchCall = mockCreate.mock.calls.find(
      ([opts]: [{ system: string }]) => opts.system.includes('CV-to-job'),
    )
    expect(cvMatchCall).toBeDefined()
    const userContent = cvMatchCall[0].messages[0].content as string
    expect(userContent).toContain('Project Alpha')
    expect(userContent).toContain('↑ 40% DAU in 6 weeks')
    expect(userContent).toContain('OSS Tool')
    expect(userContent).toContain('2K GitHub stars')
  })

  it('includes proof points in the report personalization system prompt', async () => {
    mockPrisma.profile.findFirst
      .mockResolvedValueOnce(profileWithProofPoints)
      .mockResolvedValueOnce(null)

    await runAgent('pp2', 'rpp2', 'job-pp2')()

    expect(mockStream).toHaveBeenCalledOnce()
    const systemPrompt = mockStream.mock.calls[0][0].system as string
    expect(systemPrompt).toContain('Project Alpha')
    expect(systemPrompt).toContain('↑ 40% DAU in 6 weeks')
  })

  it('omits the proof points section from CV match prompt when profile has no proof points', async () => {
    // default mock returns null profile — no proof points
    await runAgent('pp3', 'rpp3', 'job-pp3')()

    const cvMatchCall = mockCreate.mock.calls.find(
      ([opts]: [{ system: string }]) => opts.system.includes('CV-to-job'),
    )
    expect(cvMatchCall).toBeDefined()
    const userContent = cvMatchCall[0].messages[0].content as string
    expect(userContent).not.toContain('Proof points')
  })
})
