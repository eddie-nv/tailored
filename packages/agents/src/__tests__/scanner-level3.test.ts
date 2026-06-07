import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventType } from '@ag-ui/core'
import type { BaseEvent } from '@ag-ui/core'

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockCreate, mockFetch, mockPrisma } = vi.hoisted(() => {
  const mockCreate = vi.fn()
  const mockFetch = vi.fn()
  const mockPrisma = {
    profile: { findFirst: vi.fn() },
    discoveryPrefs: { findFirst: vi.fn() },
    resumePrefs: { findFirst: vi.fn() },
    job: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    customPortal: { findMany: vi.fn() },
    searchQuery: { findMany: vi.fn() },
  }
  return { mockCreate, mockFetch, mockPrisma }
})

vi.mock('@tailored/db/client', () => ({ prisma: mockPrisma }))
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}))
vi.stubGlobal('fetch', mockFetch)

// ── Static import (after mocks are declared) ──────────────────────────────────

import { ScannerAgent } from '../scanner/ScannerAgent'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSearchResults(jobs: Array<{ title: string; url: string; company: string }>): string {
  return JSON.stringify(jobs)
}

function setupBase() {
  mockPrisma.profile.findFirst.mockResolvedValue(null)
  mockPrisma.discoveryPrefs.findFirst.mockResolvedValue(null)
  mockPrisma.resumePrefs.findFirst.mockResolvedValue(null)
  mockPrisma.job.findMany.mockResolvedValue([])
  mockPrisma.job.createMany.mockResolvedValue({ count: 0 })
  mockPrisma.customPortal.findMany.mockResolvedValue([])
  mockPrisma.searchQuery.findMany.mockResolvedValue([])

  // Default fetch: 404 for ATS GET calls; 200 for HEAD liveness checks
  mockFetch.mockImplementation((_url: string, opts?: { method?: string }) => {
    if (opts?.method === 'HEAD') {
      return Promise.resolve({ ok: true, status: 200 })
    }
    return Promise.resolve({ ok: false, status: 404 })
  })

  // Default: Anthropic returns empty results
  mockCreate.mockResolvedValue({
    content: [{ type: 'text', text: '[]' }],
    stop_reason: 'end_turn',
  })
}

async function collect(obs: import('rxjs').Observable<BaseEvent>): Promise<BaseEvent[]> {
  return new Promise((resolve, reject) => {
    const events: BaseEvent[] = []
    obs.subscribe({ next: (e) => events.push(e), error: reject, complete: () => resolve(events) })
  })
}

function runScanner() {
  const agent = new ScannerAgent()
  return collect(
    agent.run({
      threadId: 'test',
      runId: 'test',
      messages: [],
      tools: [] as never[],
      context: [],
      forwardedProps: {},
      state: {},
    }),
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ScannerAgent — Level 3 (web search)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupBase()
  })

  it('does not call Anthropic when no search queries are enabled', async () => {
    mockPrisma.searchQuery.findMany.mockResolvedValue([])
    await runScanner()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('calls Anthropic once per enabled query and writes matching jobs to DB', async () => {
    mockPrisma.searchQuery.findMany.mockResolvedValue([
      { id: 'sq-1', name: 'AI jobs', query: 'AI engineer jobs site:linkedin.com', enabled: true },
    ])
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: makeSearchResults([
            { title: 'AI Engineer', url: 'https://linkedin.com/jobs/1', company: 'Anthropic' },
          ]),
        },
      ],
      stop_reason: 'end_turn',
    })

    await runScanner()

    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(mockPrisma.job.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            role: 'AI Engineer',
            company: 'Anthropic',
            url: 'https://linkedin.com/jobs/1',
            source: 'search',
          }),
        ]),
      }),
    )
  })

  it('runs one Anthropic call per query for multiple enabled queries', async () => {
    mockPrisma.searchQuery.findMany.mockResolvedValue([
      { id: 'sq-1', name: 'AI PM jobs', query: 'AI PM site:linkedin.com', enabled: true },
      { id: 'sq-2', name: 'Staff Eng jobs', query: 'Staff Engineer AI', enabled: true },
    ])

    await runScanner()

    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('excludes jobs whose liveness check fails (HEAD returns 404)', async () => {
    mockPrisma.searchQuery.findMany.mockResolvedValue([
      { id: 'sq-1', name: 'AI jobs', query: 'AI engineer', enabled: true },
    ])
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: makeSearchResults([
            { title: 'Dead Job', url: 'https://example.com/jobs/dead', company: 'Acme' },
          ]),
        },
      ],
      stop_reason: 'end_turn',
    })
    mockFetch.mockImplementation((_url: string, opts?: { method?: string }) => {
      if (opts?.method === 'HEAD') return Promise.resolve({ ok: false, status: 404 })
      return Promise.resolve({ ok: false, status: 404 })
    })

    await runScanner()

    expect(mockPrisma.job.createMany).not.toHaveBeenCalled()
  })

  it('deduplicates URLs already present in existingJobs', async () => {
    mockPrisma.job.findMany.mockResolvedValue([
      { id: 'existing', url: 'https://linkedin.com/jobs/already-there', resumes: [] },
    ])
    mockPrisma.searchQuery.findMany.mockResolvedValue([
      { id: 'sq-1', name: 'AI jobs', query: 'AI engineer', enabled: true },
    ])
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: makeSearchResults([
            {
              title: 'AI Engineer',
              url: 'https://linkedin.com/jobs/already-there',
              company: 'Acme',
            },
          ]),
        },
      ],
      stop_reason: 'end_turn',
    })

    await runScanner()

    expect(mockPrisma.job.createMany).not.toHaveBeenCalled()
  })

  it('discards unsafe URLs (http://, javascript:, data:)', async () => {
    mockPrisma.searchQuery.findMany.mockResolvedValue([
      { id: 'sq-1', name: 'test', query: 'some query', enabled: true },
    ])
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: makeSearchResults([
            { title: 'Job A', url: 'http://insecure.com/job', company: 'Acme' },
            { title: 'Job B', url: 'javascript:alert(1)', company: 'Evil' },
            { title: 'Job C', url: 'data:text/html,<b>xss</b>', company: 'Bad' },
          ]),
        },
      ],
      stop_reason: 'end_turn',
    })

    await runScanner()

    expect(mockPrisma.job.createMany).not.toHaveBeenCalled()
  })

  it('emits scan-progress-update events for each search query', async () => {
    mockPrisma.searchQuery.findMany.mockResolvedValue([
      { id: 'sq-1', name: 'AI jobs', query: 'AI engineer', enabled: true },
    ])

    const events = await runScanner()

    const progressEvents = events.filter(
      (e) => e.type === EventType.CUSTOM && (e as { name?: string }).name === 'scan-progress-update',
    )
    expect(progressEvents.length).toBeGreaterThanOrEqual(1)
  })

  it('completes without throwing when Anthropic returns an error', async () => {
    mockPrisma.searchQuery.findMany.mockResolvedValue([
      { id: 'sq-1', name: 'AI jobs', query: 'AI engineer', enabled: true },
    ])
    mockCreate.mockRejectedValue(new Error('Anthropic API error'))

    const events = await runScanner()

    expect(events.some((e) => e.type === EventType.RUN_FINISHED)).toBe(true)
    expect(mockPrisma.job.createMany).not.toHaveBeenCalled()
  })

  it('stores source="search" on jobs from search queries', async () => {
    mockPrisma.searchQuery.findMany.mockResolvedValue([
      { id: 'sq-1', name: 'AI jobs', query: 'AI engineer', enabled: true },
    ])
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: makeSearchResults([
            { title: 'ML Researcher', url: 'https://openai.com/careers/1', company: 'OpenAI' },
          ]),
        },
      ],
      stop_reason: 'end_turn',
    })

    await runScanner()

    const createCall = mockPrisma.job.createMany.mock.calls[0]?.[0]
    expect(createCall?.data?.[0]?.source).toBe('search')
  })
})
