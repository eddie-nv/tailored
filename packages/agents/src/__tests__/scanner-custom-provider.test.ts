import { describe, it, expect } from 'vitest'
import { buildCustomBatches } from '../scanner/ScannerAgent'

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
    id: 'portal-1',
    name: 'Test Co',
    url: 'https://careers.example.com',
    enabled: true,
    provider: null,
    api: null,
    method: 'auto',
    query: null,
    notes: null,
    ...overrides,
  }
}

describe('buildCustomBatches — provider override', () => {
  it('uses provider override when set, bypasses URL detection', () => {
    const portal = makePortal({
      provider: 'Greenhouse',
      url: 'https://careers.example.com',
      api: 'https://boards-api.greenhouse.io/v1/boards/example-co',
    })
    const { scannable, zeroMatch } = buildCustomBatches([portal])
    expect(zeroMatch).toHaveLength(0)
    expect(scannable).toHaveLength(1)
    expect(scannable[0]!.platformName).toBe('Greenhouse')
    expect(scannable[0]!.portals[0]!.slug).toBe('example-co')
  })

  it('lands in zeroMatch when provider is null and URL is unrecognised', () => {
    const portal = makePortal({ provider: null, url: 'https://careers.example.com' })
    const { scannable, zeroMatch } = buildCustomBatches([portal])
    expect(zeroMatch).toHaveLength(1)
    expect(scannable).toHaveLength(0)
  })

  it('Ashby portal with provider override and no api uses first slug from url', () => {
    const portal = makePortal({
      provider: 'Ashby',
      url: 'https://jobs.ashbyhq.com/anthropic',
      api: null,
    })
    const { scannable, zeroMatch } = buildCustomBatches([portal])
    expect(zeroMatch).toHaveLength(0)
    expect(scannable[0]!.platformName).toBe('Ashby')
    expect(scannable[0]!.portals[0]!.slug).toBe('anthropic')
  })

  it('Greenhouse portal with api URL uses last path segment as slug', () => {
    const portal = makePortal({
      provider: 'Greenhouse',
      url: 'https://careers.anthropic.com',
      api: 'https://boards-api.greenhouse.io/v1/boards/anthropic',
    })
    const { scannable } = buildCustomBatches([portal])
    expect(scannable[0]!.portals[0]!.slug).toBe('anthropic')
  })

  it('portal with no provider and no recognisable URL pattern lands in zeroMatch', () => {
    const portal = makePortal({ url: 'https://niche-company.io/careers' })
    const { zeroMatch } = buildCustomBatches([portal])
    expect(zeroMatch).toHaveLength(1)
  })

  it('groups multiple portals by platform', () => {
    const portals = [
      makePortal({ id: 'a', provider: 'Ashby', url: 'https://jobs.ashbyhq.com/alpha' }),
      makePortal({ id: 'b', provider: 'Ashby', url: 'https://jobs.ashbyhq.com/beta' }),
    ]
    const { scannable } = buildCustomBatches(portals)
    expect(scannable).toHaveLength(1)
    expect(scannable[0]!.portals).toHaveLength(2)
  })
})
