import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { buildCustomBatches } from '../ScannerAgent'

// ─── buildCustomBatches — routing ────────────────────────────────────────────

type PortalInput = {
  id: string
  name: string
  url: string
  enabled: boolean
  provider: string | null
  api: string | null
  method: string
  query: string | null
  notes: string | null
}

function makePortal(overrides: Partial<PortalInput> = {}): PortalInput {
  return {
    id: 'p1',
    name: 'Acme',
    url: 'https://acme.com/jobs',
    enabled: true,
    provider: null,
    api: null,
    method: 'auto',
    query: null,
    notes: null,
    ...overrides,
  }
}

describe('buildCustomBatches — method routing', () => {
  it('routes method=auto with detectable URL to scannable batches', () => {
    const portal = makePortal({ url: 'https://jobs.ashbyhq.com/acme' })
    const { scannable, websearch, zeroMatch } = buildCustomBatches([portal])
    expect(scannable.length).toBe(1)
    expect(websearch).toHaveLength(0)
    expect(zeroMatch).toHaveLength(0)
  })

  it('routes method=websearch to websearch list regardless of URL', () => {
    const portal = makePortal({
      url: 'https://acme.com/jobs',
      method: 'websearch',
      query: 'site:acme.com jobs engineer',
    })
    const { scannable, websearch, zeroMatch } = buildCustomBatches([portal])
    expect(websearch).toHaveLength(1)
    expect(websearch[0].id).toBe('p1')
    expect(scannable).toHaveLength(0)
    expect(zeroMatch).toHaveLength(0)
  })

  it('routes method=auto with undetectable URL to zeroMatch (not dropped)', () => {
    const portal = makePortal({ url: 'https://mystery.io/jobs', method: 'auto' })
    const { scannable, websearch, zeroMatch } = buildCustomBatches([portal])
    expect(zeroMatch).toHaveLength(1)
    expect(zeroMatch[0].id).toBe('p1')
    expect(scannable).toHaveLength(0)
    expect(websearch).toHaveLength(0)
  })

  it('websearch portal with empty query goes to zeroMatch', () => {
    const portal = makePortal({ method: 'websearch', query: null })
    const { websearch, zeroMatch } = buildCustomBatches([portal])
    expect(websearch).toHaveLength(0)
    expect(zeroMatch).toHaveLength(1)
  })

  it('websearch portal with whitespace-only query goes to zeroMatch', () => {
    const portal = makePortal({ method: 'websearch', query: '   ' })
    const { websearch, zeroMatch } = buildCustomBatches([portal])
    expect(websearch).toHaveLength(0)
    expect(zeroMatch).toHaveLength(1)
  })

  it('splits a mixed list correctly', () => {
    const portals = [
      makePortal({ id: 'a', url: 'https://jobs.ashbyhq.com/acme', method: 'auto' }),
      makePortal({ id: 'b', url: 'https://mystery.io/jobs', method: 'auto' }),
      makePortal({ id: 'c', method: 'websearch', query: 'site:mystery.io jobs' }),
    ]
    const { scannable, websearch, zeroMatch } = buildCustomBatches(portals)
    expect(scannable).toHaveLength(1)
    expect(websearch).toHaveLength(1)
    expect(zeroMatch).toHaveLength(1)
  })
})

// ─── runWebSearchTarget ───────────────────────────────────────────────────────

import { runWebSearchTarget } from '../ScannerAgent'
import type { StoredTitleFilter, StoredLocationFilter } from '../filters'

const PASS_ALL_TITLE: StoredTitleFilter = { derived: [], custom: [], negative: [], seniorityBoost: [] }
const PASS_ALL_LOCATION: StoredLocationFilter = { derived: [], alwaysAllow: [], allow: [], block: [] }

function makeWebSearchPortal(overrides: Partial<PortalInput> = {}): PortalInput {
  return makePortal({ method: 'websearch', query: 'site:acme.com jobs', ...overrides })
}

describe('runWebSearchTarget', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls runSearchQuery with portal.query and returns filtered hits', async () => {
    const mockRunSearchQuery = vi.fn().mockResolvedValue([
      { title: 'Senior Engineer', url: 'https://acme.com/job/1', company: 'Acme', queryName: 'Acme' },
      { title: 'Intern', url: 'https://acme.com/job/2', company: 'Acme', queryName: 'Acme' },
    ])

    const portal = makeWebSearchPortal({ name: 'Acme', query: 'site:acme.com jobs' })
    const existingUrls = new Set<string>()
    const titleFilter: StoredTitleFilter = {
      ...PASS_ALL_TITLE,
      negative: ['intern'],
    }

    const jobs = await runWebSearchTarget(
      portal,
      existingUrls,
      titleFilter,
      PASS_ALL_LOCATION,
      new AbortController().signal,
      mockRunSearchQuery,
    )

    expect(mockRunSearchQuery).toHaveBeenCalledWith(
      'site:acme.com jobs',
      'Acme',
      expect.any(AbortSignal),
    )
    expect(jobs).toHaveLength(1)
    expect(jobs[0].role).toBe('Senior Engineer')
    expect(jobs[0].source).toBe('search:Acme')
  })

  it('deduplicates against existingUrls', async () => {
    const mockRunSearchQuery = vi.fn().mockResolvedValue([
      { title: 'Engineer', url: 'https://acme.com/job/1', company: 'Acme', queryName: 'Acme' },
    ])

    const portal = makeWebSearchPortal()
    const existingUrls = new Set(['https://acme.com/job/1'])

    const jobs = await runWebSearchTarget(
      portal,
      existingUrls,
      PASS_ALL_TITLE,
      PASS_ALL_LOCATION,
      new AbortController().signal,
      mockRunSearchQuery,
    )

    expect(jobs).toHaveLength(0)
  })

  it('applies block filter to websearch results when location is present', async () => {
    const mockRunSearchQuery = vi.fn().mockResolvedValue([
      { title: 'Engineer', url: 'https://acme.com/1', company: 'Acme', queryName: 'Acme', location: 'Beijing, China' },
    ])

    const portal = makeWebSearchPortal()
    const locationFilter: StoredLocationFilter = {
      ...PASS_ALL_LOCATION,
      block: ['China'],
    }

    const jobs = await runWebSearchTarget(
      portal,
      new Set(),
      PASS_ALL_TITLE,
      locationFilter,
      new AbortController().signal,
      mockRunSearchQuery,
    )

    expect(jobs).toHaveLength(0)
  })

  it('sets source to search:<portalName>', async () => {
    const mockRunSearchQuery = vi.fn().mockResolvedValue([
      { title: 'Engineer', url: 'https://acme.com/1', company: 'Acme', queryName: 'Acme' },
    ])

    const portal = makeWebSearchPortal({ name: 'Acme Corp' })
    const jobs = await runWebSearchTarget(
      portal,
      new Set(),
      PASS_ALL_TITLE,
      PASS_ALL_LOCATION,
      new AbortController().signal,
      mockRunSearchQuery,
    )

    expect(jobs[0].source).toBe('search:Acme Corp')
  })

  it('returns empty array when runSearchQuery throws', async () => {
    const mockRunSearchQuery = vi.fn().mockRejectedValue(new Error('API error'))
    const portal = makeWebSearchPortal()

    const jobs = await runWebSearchTarget(
      portal,
      new Set(),
      PASS_ALL_TITLE,
      PASS_ALL_LOCATION,
      new AbortController().signal,
      mockRunSearchQuery,
    )

    expect(jobs).toHaveLength(0)
  })
})
