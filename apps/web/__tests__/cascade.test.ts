import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cascadeDerivedTitles, areDerivedTitlesEqual } from '../app/lib/cascade'

// Minimal prisma-shaped double — only the operations cascade needs
function makePrisma(existing: { id: string; titleFilter: string | null } | null) {
  return {
    discoveryPrefs: {
      findFirst: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue({ id: 'cuid1', titleFilter: '{}' }),
      create: vi.fn().mockResolvedValue({ id: 'cuid1', titleFilter: '{}' }),
    },
  }
}

function titleFilter(derived: string[], custom: string[] = []) {
  return JSON.stringify({
    derived,
    custom,
    negative: [],
    seniorityBoost: ['Senior', 'Staff'],
  })
}

// ── areDerivedTitlesEqual ─────────────────────────────────────────────────────

describe('areDerivedTitlesEqual', () => {
  it('returns true for two empty arrays', () => {
    expect(areDerivedTitlesEqual([], [])).toBe(true)
  })

  it('returns true for identical arrays', () => {
    expect(areDerivedTitlesEqual(['Staff Engineer', 'EM'], ['Staff Engineer', 'EM'])).toBe(true)
  })

  it('returns false when lengths differ', () => {
    expect(areDerivedTitlesEqual(['Staff Engineer'], [])).toBe(false)
  })

  it('returns false when content differs', () => {
    expect(areDerivedTitlesEqual(['Staff Engineer'], ['Principal Engineer'])).toBe(false)
  })

  it('is order-sensitive', () => {
    expect(areDerivedTitlesEqual(['A', 'B'], ['B', 'A'])).toBe(false)
  })
})

// ── cascadeDerivedTitles ──────────────────────────────────────────────────────

describe('cascadeDerivedTitles — idempotency', () => {
  it('skips the DB write when derived titles are unchanged', async () => {
    const prisma = makePrisma({
      id: 'cuid1',
      titleFilter: titleFilter(['Staff Engineer']),
    })

    await cascadeDerivedTitles(['Staff Engineer'], prisma)

    expect(prisma.discoveryPrefs.update).not.toHaveBeenCalled()
  })

  it('writes when derived titles change', async () => {
    const prisma = makePrisma({
      id: 'cuid1',
      titleFilter: titleFilter(['Staff Engineer']),
    })

    await cascadeDerivedTitles(['Principal Engineer'], prisma)

    expect(prisma.discoveryPrefs.update).toHaveBeenCalledOnce()
    const writtenFilter = JSON.parse(
      prisma.discoveryPrefs.update.mock.calls[0][0].data.titleFilter,
    )
    expect(writtenFilter.derived).toEqual(['Principal Engineer'])
  })

  it('writes when titles are added to the existing list', async () => {
    const prisma = makePrisma({
      id: 'cuid1',
      titleFilter: titleFilter(['Staff Engineer']),
    })

    await cascadeDerivedTitles(['Staff Engineer', 'EM'], prisma)

    expect(prisma.discoveryPrefs.update).toHaveBeenCalledOnce()
  })

  it('writes when derived list is cleared', async () => {
    const prisma = makePrisma({
      id: 'cuid1',
      titleFilter: titleFilter(['Staff Engineer']),
    })

    await cascadeDerivedTitles([], prisma)

    expect(prisma.discoveryPrefs.update).toHaveBeenCalledOnce()
    const writtenFilter = JSON.parse(
      prisma.discoveryPrefs.update.mock.calls[0][0].data.titleFilter,
    )
    expect(writtenFilter.derived).toEqual([])
  })

  it('skips the write when both derived lists are empty', async () => {
    const prisma = makePrisma({
      id: 'cuid1',
      titleFilter: titleFilter([]),
    })

    await cascadeDerivedTitles([], prisma)

    expect(prisma.discoveryPrefs.update).not.toHaveBeenCalled()
  })
})

describe('cascadeDerivedTitles — create path', () => {
  it('creates discoveryPrefs when none exist', async () => {
    const prisma = makePrisma(null)

    await cascadeDerivedTitles(['Staff Engineer'], prisma)

    expect(prisma.discoveryPrefs.create).toHaveBeenCalledOnce()
    const created = prisma.discoveryPrefs.create.mock.calls[0][0].data
    const tf = JSON.parse(created.titleFilter)
    expect(tf.derived).toEqual(['Staff Engineer'])
  })

  it('preserves custom/negative/seniorityBoost when updating', async () => {
    const prisma = makePrisma({
      id: 'cuid1',
      titleFilter: JSON.stringify({
        derived: ['Old'],
        custom: ['Custom1'],
        negative: ['intern'],
        seniorityBoost: ['Senior'],
      }),
    })

    await cascadeDerivedTitles(['New Title'], prisma)

    const written = JSON.parse(
      prisma.discoveryPrefs.update.mock.calls[0][0].data.titleFilter,
    )
    expect(written.derived).toEqual(['New Title'])
    expect(written.custom).toEqual(['Custom1'])
    expect(written.negative).toEqual(['intern'])
    expect(written.seniorityBoost).toEqual(['Senior'])
  })
})
