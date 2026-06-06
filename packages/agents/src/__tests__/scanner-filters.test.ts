import { describe, it, expect } from 'vitest'
import { matchesLocationFilter } from '../scanner/filters'
import type { StoredLocationFilter } from '../scanner/filters'

const empty: StoredLocationFilter = { derived: [], allow: [], block: [], alwaysAllow: [] }

describe('matchesLocationFilter', () => {
  it('passes when location is undefined', () => {
    expect(matchesLocationFilter(undefined, empty)).toBe(true)
  })

  it('passes when location is empty string', () => {
    expect(matchesLocationFilter('', empty)).toBe(true)
  })

  it('passes when location is whitespace only', () => {
    expect(matchesLocationFilter('   ', empty)).toBe(true)
  })

  it('passes any location when all filter arrays are empty', () => {
    expect(matchesLocationFilter('New York, US', empty)).toBe(true)
  })

  it('blocks a location matching the block list', () => {
    const filter = { ...empty, block: ['China'] }
    expect(matchesLocationFilter('Beijing, China', filter)).toBe(false)
  })

  it('passes a location not in the block list', () => {
    const filter = { ...empty, block: ['China'] }
    expect(matchesLocationFilter('San Francisco, US', filter)).toBe(true)
  })

  it('alwaysAllow rescues a blocked location', () => {
    const filter: StoredLocationFilter = {
      derived: [],
      allow: [],
      block: ['China'],
      alwaysAllow: ['Hong Kong'],
    }
    expect(matchesLocationFilter('Hong Kong, China', filter)).toBe(true)
  })

  it('alwaysAllow check runs before block check', () => {
    const filter: StoredLocationFilter = {
      derived: [],
      allow: [],
      block: ['China', 'Hong Kong'],
      alwaysAllow: ['Hong Kong'],
    }
    expect(matchesLocationFilter('Hong Kong', filter)).toBe(true)
  })

  it('passes when location matches the allow list', () => {
    const filter = { ...empty, allow: ['United States', 'Remote'] }
    expect(matchesLocationFilter('New York, United States', filter)).toBe(true)
  })

  it('fails when allow list is set and location does not match', () => {
    const filter = { ...empty, allow: ['United States', 'Remote'] }
    expect(matchesLocationFilter('London, UK', filter)).toBe(false)
  })

  it('derived acts as effective allow', () => {
    const filter = { ...empty, derived: ['Remote'] }
    expect(matchesLocationFilter('Fully Remote', filter)).toBe(true)
    expect(matchesLocationFilter('New York', filter)).toBe(false)
  })

  it('derived and allow combine as effective allow', () => {
    const filter: StoredLocationFilter = {
      derived: ['Remote'],
      allow: ['United States'],
      block: [],
      alwaysAllow: [],
    }
    expect(matchesLocationFilter('New York, United States', filter)).toBe(true)
    expect(matchesLocationFilter('Remote', filter)).toBe(true)
    expect(matchesLocationFilter('London, UK', filter)).toBe(false)
  })

  it('matching is case-insensitive', () => {
    const filter = { ...empty, allow: ['remote'] }
    expect(matchesLocationFilter('REMOTE', filter)).toBe(true)
  })

  it('substring match (e.g. "Remote" matches "San Francisco / Remote")', () => {
    const filter = { ...empty, derived: ['Remote'] }
    expect(matchesLocationFilter('San Francisco / Remote', filter)).toBe(true)
  })

  it('passes missing location regardless of filter contents', () => {
    const filter: StoredLocationFilter = {
      derived: ['Remote'],
      allow: [],
      block: ['China'],
      alwaysAllow: [],
    }
    expect(matchesLocationFilter(undefined, filter)).toBe(true)
    expect(matchesLocationFilter('', filter)).toBe(true)
  })
})
