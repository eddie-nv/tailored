import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventType } from '@ag-ui/core'
import type { BaseEvent } from '@ag-ui/core'

const { mockCreate, mockPrisma, mockChromium } = vi.hoisted(() => {
  const mockPage = {
    setContent: vi.fn().mockResolvedValue(undefined),
    pdf: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.4 fake')),
  }
  const mockBrowser = {
    newPage: vi.fn().mockResolvedValue(mockPage),
    close: vi.fn().mockResolvedValue(undefined),
  }
  const mockChromium = {
    launch: vi.fn().mockResolvedValue(mockBrowser),
  }
  const mockCreate = vi.fn()
  const mockPrisma = {
    profile: { findFirst: vi.fn() },
    discoveryPrefs: { findFirst: vi.fn() },
    resumePrefs: { findFirst: vi.fn() },
    job: { findMany: vi.fn() },
    generatedResume: {
      create: vi.fn().mockResolvedValue({
        id: 'resume-1',
        jobId: 'job-1',
        filename: 'job-1-123.pdf',
        path: '/tmp/job-1-123.pdf',
        createdAt: new Date(),
      }),
    },
  }
  return { mockCreate, mockPrisma, mockChromium }
})

vi.mock('@tailored/db/client', () => ({ prisma: mockPrisma }))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}))

vi.mock('playwright', () => ({ chromium: mockChromium }))

vi.mock('fs', () => ({
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}))

const JOB = {
  id: 'job-1',
  company: 'Acme',
  role: 'Staff Engineer',
  archetype: 'Agentic',
  evalReport: JSON.stringify({ 'Role Summary': 'Great role.' }),
  score: 'A',
  cvMatchPct: 80,
  status: 'reviewed',
  url: null,
  source: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  resumes: [],
}

function setupDefaultMocks() {
  mockPrisma.profile.findFirst.mockResolvedValue(null)
  mockPrisma.discoveryPrefs.findFirst.mockResolvedValue(null)
  mockPrisma.resumePrefs.findFirst.mockResolvedValue(null)
  mockPrisma.job.findMany.mockResolvedValue([JOB])

  mockCreate.mockResolvedValue({
    content: [{ type: 'text', text: '# Optimized CV\n\nExperience section here.' }],
  })
}

async function collect(obs: import('rxjs').Observable<BaseEvent>): Promise<BaseEvent[]> {
  return new Promise((resolve, reject) => {
    const events: BaseEvent[] = []
    obs.subscribe({ next: (e) => events.push(e), error: reject, complete: () => resolve(events) })
  })
}

async function runAgent(jobId = 'job-1') {
  const { CVAgent } = await import('../cv/CVAgent.js')
  const agent = new CVAgent()
  return collect(
    agent.run({
      threadId: crypto.randomUUID(),
      runId: crypto.randomUUID(),
      messages: [],
      tools: [],
      context: [],
      forwardedProps: {},
      state: { jobId },
    }),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  setupDefaultMocks()
})

describe('CVAgent', () => {
  it('emits RUN_ERROR when jobId is missing', async () => {
    const { CVAgent } = await import('../cv/CVAgent.js')
    const agent = new CVAgent()
    const events = await collect(
      agent.run({ threadId: 'x', runId: 'x', messages: [], tools: [], context: [], forwardedProps: {}, state: {} }),
    )
    expect(events.find((e) => e.type === EventType.RUN_ERROR)).toBeDefined()
  })

  it('emits RUN_ERROR when job is not found', async () => {
    mockPrisma.job.findMany.mockResolvedValue([])
    const events = await runAgent('missing-job')
    expect(events.find((e) => e.type === EventType.RUN_ERROR)).toBeDefined()
  })

  it('emits RUN_STARTED and RUN_FINISHED on success', async () => {
    const events = await runAgent()
    expect(events[0]?.type).toBe(EventType.RUN_STARTED)
    expect(events[events.length - 1]?.type).toBe(EventType.RUN_FINISHED)
  })

  it('emits all 3 STEP_STARTED events', async () => {
    const events = await runAgent()
    const names = events
      .filter((e) => e.type === EventType.STEP_STARTED)
      .map((e) => (e as BaseEvent & { stepName: string }).stepName)
    expect(names).toContain('keyword-injection')
    expect(names).toContain('template-render')
    expect(names).toContain('pdf-generation')
  })

  it('emits CUSTOM pdf-ready event with downloadUrl', async () => {
    const events = await runAgent()
    const custom = events.find(
      (e) => e.type === EventType.CUSTOM && (e as BaseEvent & { name: string }).name === 'pdf-ready',
    ) as (BaseEvent & { value: { jobId: string; downloadUrl: string } }) | undefined
    expect(custom).toBeDefined()
    expect(custom?.value.jobId).toBe('job-1')
    expect(custom?.value.downloadUrl).toMatch(/\/api\/resumes\//)
  })
})

describe('CVAgent — proof points wiring', () => {
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

  it('includes proof point hero metrics in the keyword injection prompt', async () => {
    mockPrisma.profile.findFirst.mockResolvedValue(profileWithProofPoints)

    await runAgent()

    expect(mockCreate).toHaveBeenCalledOnce()
    const userContent = mockCreate.mock.calls[0][0].messages[0].content as string
    expect(userContent).toContain('↑ 40% DAU in 6 weeks')
    expect(userContent).toContain('2K GitHub stars')
  })

  it('includes proof point names in the keyword injection prompt', async () => {
    mockPrisma.profile.findFirst.mockResolvedValue(profileWithProofPoints)

    await runAgent()

    const userContent = mockCreate.mock.calls[0][0].messages[0].content as string
    expect(userContent).toContain('Project Alpha')
    expect(userContent).toContain('OSS Tool')
  })

  it('includes proof point URLs in the keyword injection prompt', async () => {
    mockPrisma.profile.findFirst.mockResolvedValue(profileWithProofPoints)

    await runAgent()

    const userContent = mockCreate.mock.calls[0][0].messages[0].content as string
    expect(userContent).toContain('https://alpha.example.com')
  })

  it('handles a profile with no proof points without erroring', async () => {
    // default mock: null profile → no proof points
    const events = await runAgent()
    expect(events[events.length - 1]?.type).toBe(EventType.RUN_FINISHED)
    expect(events.find((e) => e.type === EventType.RUN_ERROR)).toBeUndefined()
  })

  it('omits the proof points section from the prompt when there are none', async () => {
    await runAgent()

    const userContent = mockCreate.mock.calls[0][0].messages[0].content as string
    expect(userContent).not.toContain('Proof points')
  })
})
