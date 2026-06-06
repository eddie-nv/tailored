import { describe, it, expect, vi } from 'vitest'
import { cascadeDerivedLocations } from '../app/lib/cascade'

function makeLocationPrisma(existing: { id: string; locationFilter: string | null } | null) {
  return {
    discoveryPrefs: {
      findFirst: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue({}),
      create: vi.fn().mockResolvedValue({}),
    },
  }
}

function locationFilter(
  derived: string[],
  allow: string[] = [],
  block: string[] = [],
  alwaysAllow: string[] = [],
) {
  return JSON.stringify({ derived, allow, block, alwaysAllow })
}

describe('cascadeDerivedLocations — idempotency', () => {
  it('skips write when derived is unchanged', async () => {
    const prisma = makeLocationPrisma({ id: 'c1', locationFilter: locationFilter(['Remote']) })
    await cascadeDerivedLocations(['Remote'], prisma)
    expect(prisma.discoveryPrefs.update).not.toHaveBeenCalled()
  })

  it('writes when derived changes', async () => {
    const prisma = makeLocationPrisma({ id: 'c1', locationFilter: locationFilter(['Remote']) })
    await cascadeDerivedLocations(['London', 'Remote'], prisma)
    expect(prisma.discoveryPrefs.update).toHaveBeenCalledOnce()
    const written = JSON.parse(
      prisma.discoveryPrefs.update.mock.calls[0][0].data.locationFilter,
    )
    expect(written.derived).toEqual(['London', 'Remote'])
  })

  it('preserves allow/block/alwaysAllow when updating derived', async () => {
    const prisma = makeLocationPrisma({
      id: 'c1',
      locationFilter: locationFilter(['Remote'], ['US'], ['China'], ['Hawaii']),
    })
    await cascadeDerivedLocations(['Hybrid'], prisma)
    const written = JSON.parse(
      prisma.discoveryPrefs.update.mock.calls[0][0].data.locationFilter,
    )
    expect(written.derived).toEqual(['Hybrid'])
    expect(written.allow).toEqual(['US'])
    expect(written.block).toEqual(['China'])
    expect(written.alwaysAllow).toEqual(['Hawaii'])
  })

  it('skips write when both derived are empty', async () => {
    const prisma = makeLocationPrisma({ id: 'c1', locationFilter: locationFilter([]) })
    await cascadeDerivedLocations([], prisma)
    expect(prisma.discoveryPrefs.update).not.toHaveBeenCalled()
  })

  it('writes when derived is cleared', async () => {
    const prisma = makeLocationPrisma({ id: 'c1', locationFilter: locationFilter(['Remote']) })
    await cascadeDerivedLocations([], prisma)
    expect(prisma.discoveryPrefs.update).toHaveBeenCalledOnce()
    const written = JSON.parse(
      prisma.discoveryPrefs.update.mock.calls[0][0].data.locationFilter,
    )
    expect(written.derived).toEqual([])
  })
})

describe('cascadeDerivedLocations — create path', () => {
  it('creates discoveryPrefs when none exist', async () => {
    const prisma = makeLocationPrisma(null)
    await cascadeDerivedLocations(['Remote'], prisma)
    expect(prisma.discoveryPrefs.create).toHaveBeenCalledOnce()
    const data = prisma.discoveryPrefs.create.mock.calls[0][0].data
    const lf = JSON.parse(data.locationFilter)
    expect(lf.derived).toEqual(['Remote'])
    expect(lf.allow).toEqual([])
    expect(lf.block).toEqual([])
    expect(lf.alwaysAllow).toEqual([])
  })

  it('handles null locationFilter on existing record', async () => {
    const prisma = makeLocationPrisma({ id: 'c1', locationFilter: null })
    await cascadeDerivedLocations(['Remote'], prisma)
    expect(prisma.discoveryPrefs.update).toHaveBeenCalledOnce()
    const written = JSON.parse(
      prisma.discoveryPrefs.update.mock.calls[0][0].data.locationFilter,
    )
    expect(written.derived).toEqual(['Remote'])
    expect(written.allow).toEqual([])
  })
})
