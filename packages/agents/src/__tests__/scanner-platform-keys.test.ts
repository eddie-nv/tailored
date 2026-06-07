import { describe, it, expect } from 'vitest'
import { buildPlatformBatches } from '../scanner/ScannerAgent'

describe('buildPlatformBatches — platform-level keys', () => {
  it('returns all 10 Ashby portals for key "ashby"', () => {
    const batches = buildPlatformBatches(['ashby'])
    expect(batches).toHaveLength(1)
    expect(batches[0]!.platformName).toBe('Ashby')
    expect(batches[0]!.portals).toHaveLength(10)
  })

  it('returns all 12 Greenhouse portals for key "greenhouse"', () => {
    const batches = buildPlatformBatches(['greenhouse'])
    expect(batches).toHaveLength(1)
    expect(batches[0]!.platformName).toBe('Greenhouse')
    expect(batches[0]!.portals).toHaveLength(12)
  })

  it('returns all 8 Lever portals for key "lever"', () => {
    const batches = buildPlatformBatches(['lever'])
    expect(batches).toHaveLength(1)
    expect(batches[0]!.platformName).toBe('Lever')
    expect(batches[0]!.portals).toHaveLength(8)
  })
})

describe('buildPlatformBatches — backward compat with individual keys', () => {
  it('returns only Linear for "ashby-linear"', () => {
    const batches = buildPlatformBatches(['ashby-linear'])
    expect(batches).toHaveLength(1)
    expect(batches[0]!.platformName).toBe('Ashby')
    expect(batches[0]!.portals).toHaveLength(1)
    expect(batches[0]!.portals[0]!.slug).toBe('linear')
  })

  it('returns only Airbnb for "greenhouse-airbnb"', () => {
    const batches = buildPlatformBatches(['greenhouse-airbnb'])
    expect(batches).toHaveLength(1)
    expect(batches[0]!.portals).toHaveLength(1)
    expect(batches[0]!.portals[0]!.slug).toBe('airbnb')
  })
})

describe('buildPlatformBatches — mixed platform + company keys', () => {
  it('merges "ashby" + "greenhouse-airbnb" without duplicates', () => {
    const batches = buildPlatformBatches(['ashby', 'greenhouse-airbnb'])
    expect(batches).toHaveLength(2)

    const ashbyBatch = batches.find((b) => b.platformName === 'Ashby')!
    const ghBatch = batches.find((b) => b.platformName === 'Greenhouse')!

    expect(ashbyBatch.portals).toHaveLength(10)
    expect(ghBatch.portals).toHaveLength(1)
    expect(ghBatch.portals[0]!.slug).toBe('airbnb')
  })

  it('de-dupes when "ashby" and "ashby-linear" are both present', () => {
    const batches = buildPlatformBatches(['ashby', 'ashby-linear'])
    expect(batches).toHaveLength(1)
    expect(batches[0]!.portals).toHaveLength(10)
  })

  it('handles all three platforms together', () => {
    const batches = buildPlatformBatches(['ashby', 'greenhouse', 'lever'])
    expect(batches).toHaveLength(3)
    const total = batches.reduce((n, b) => n + b.portals.length, 0)
    expect(total).toBe(30) // 10 + 12 + 8
  })
})

describe('buildPlatformBatches — edge cases', () => {
  it('returns empty array for empty input', () => {
    expect(buildPlatformBatches([])).toEqual([])
  })

  it('ignores non-scannable platform keys like "wellfound"', () => {
    // "wellfound" is not a scannable platform key (no public API)
    const batches = buildPlatformBatches(['wellfound'])
    expect(batches).toHaveLength(0)
  })
})
