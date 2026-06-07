import { describe, it, expect } from 'vitest'
import { parseProofPoints } from '../shared/state.js'

const makeProfile = (proofPoints: unknown) =>
  ({ proofPoints: proofPoints !== undefined ? JSON.stringify(proofPoints) : null }) as Parameters<typeof parseProofPoints>[0]

describe('parseProofPoints', () => {
  it('returns empty array when profile is null', () => {
    expect(parseProofPoints(null)).toEqual([])
  })

  it('returns empty array when proofPoints field is null', () => {
    expect(parseProofPoints({ proofPoints: null } as Parameters<typeof parseProofPoints>[0])).toEqual([])
  })

  it('returns empty array when proofPoints is malformed JSON', () => {
    expect(parseProofPoints({ proofPoints: 'not-json' } as Parameters<typeof parseProofPoints>[0])).toEqual([])
  })

  it('returns empty array when proofPoints JSON is not an array', () => {
    expect(parseProofPoints(makeProfile({ name: 'x', heroMetric: 'y' }))).toEqual([])
  })

  it('parses a valid array of proof points', () => {
    const input = [
      { name: 'Project Alpha', url: 'https://example.com', heroMetric: '↑ 40% DAU' },
      { name: 'OSS Tool', url: 'https://github.com/x', heroMetric: '2K stars' },
    ]
    expect(parseProofPoints(makeProfile(input))).toEqual(input)
  })

  it('filters out entries missing name', () => {
    const input = [
      { name: '', url: 'https://example.com', heroMetric: '↑ 40% DAU' },
      { name: 'Valid', url: 'https://example.com', heroMetric: '2K stars' },
    ]
    expect(parseProofPoints(makeProfile(input))).toEqual([input[1]])
  })

  it('filters out entries missing heroMetric', () => {
    const input = [
      { name: 'Valid', url: 'https://example.com', heroMetric: '' },
      { name: 'Also Valid', url: 'https://example.com', heroMetric: '↑ 40%' },
    ]
    expect(parseProofPoints(makeProfile(input))).toEqual([input[1]])
  })

  it('url is optional — keeps entries with no url', () => {
    const input = [{ name: 'Project', url: '', heroMetric: '↑ 40% DAU' }]
    expect(parseProofPoints(makeProfile(input))).toEqual(input)
  })

  it('returns empty array when all entries are invalid', () => {
    const input = [{ name: '', heroMetric: '' }, { notAProofPoint: true }]
    expect(parseProofPoints(makeProfile(input))).toEqual([])
  })
})
