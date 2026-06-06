import { describe, it, expect } from 'vitest'
import { computeDerivedLocations } from '../app/lib/locationFilter'

describe('computeDerivedLocations', () => {
  it('returns empty array when no profile fields set', () => {
    expect(computeDerivedLocations({})).toEqual([])
  })

  it('returns ["Remote"] for remote workType', () => {
    expect(computeDerivedLocations({ workType: 'remote' })).toEqual(['Remote'])
  })

  it('returns ["Remote", "Hybrid"] for hybrid workType', () => {
    expect(computeDerivedLocations({ workType: 'hybrid' })).toEqual(['Remote', 'Hybrid'])
  })

  it('returns empty array for onsite workType', () => {
    expect(computeDerivedLocations({ workType: 'onsite' })).toEqual([])
  })

  it('includes location string', () => {
    expect(computeDerivedLocations({ location: 'London, UK' })).toEqual(['London, UK'])
  })

  it('includes locationFlexibility string', () => {
    expect(computeDerivedLocations({ locationFlexibility: 'Open to Bay Area' })).toEqual([
      'Open to Bay Area',
    ])
  })

  it('combines workType and location', () => {
    expect(computeDerivedLocations({ workType: 'remote', location: 'London' })).toEqual([
      'Remote',
      'London',
    ])
  })

  it('deduplicates when workType and location produce same value', () => {
    expect(computeDerivedLocations({ workType: 'remote', location: 'Remote' })).toEqual(['Remote'])
  })

  it('trims whitespace from location fields', () => {
    expect(computeDerivedLocations({ location: '  London  ' })).toEqual(['London'])
  })

  it('ignores empty/whitespace-only location strings', () => {
    expect(computeDerivedLocations({ location: '   ' })).toEqual([])
  })

  it('handles null values gracefully', () => {
    expect(
      computeDerivedLocations({ workType: null, location: null, locationFlexibility: null }),
    ).toEqual([])
  })

  it('combines all three fields', () => {
    expect(
      computeDerivedLocations({
        workType: 'hybrid',
        location: 'San Francisco',
        locationFlexibility: 'Open to New York',
      }),
    ).toEqual(['Remote', 'Hybrid', 'San Francisco', 'Open to New York'])
  })
})
