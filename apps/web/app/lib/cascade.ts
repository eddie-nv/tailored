const DEFAULT_SENIORITY_BOOST = ['Senior', 'Staff', 'Principal', 'Lead', 'Head', 'Director']

type TitleFilter = {
  derived: string[]
  custom: string[]
  negative: string[]
  seniorityBoost: string[]
}

type DiscoveryPrefsRow = {
  id: string
  titleFilter: string | null
}

type DiscoveryPrefsCreateData = {
  portals: string
  keywords: string
  titleFilter: string
}

// Minimal interface — only the operations cascade needs from prisma
type CascadePrisma = {
  discoveryPrefs: {
    findFirst: () => Promise<DiscoveryPrefsRow | null>
    update: (args: { where: { id: string }; data: { titleFilter: string } }) => Promise<unknown>
    create: (args: { data: DiscoveryPrefsCreateData }) => Promise<unknown>
  }
}

export function areDerivedTitlesEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((title, i) => title === b[i])
}

// ── Location filter cascade ───────────────────────────────────────────────────

type StoredLocationFilter = {
  derived: string[]
  allow: string[]
  block: string[]
  alwaysAllow: string[]
}

const EMPTY_LOCATION_FILTER: StoredLocationFilter = {
  derived: [],
  allow: [],
  block: [],
  alwaysAllow: [],
}

type LocationCascadeRow = { id: string; locationFilter: string | null }

type CascadeLocationPrisma = {
  discoveryPrefs: {
    findFirst: () => Promise<LocationCascadeRow | null>
    update: (args: {
      where: { id: string }
      data: { locationFilter: string }
    }) => Promise<unknown>
    create: (args: {
      data: { portals: string; keywords: string; locationFilter: string }
    }) => Promise<unknown>
  }
}

export async function cascadeDerivedLocations(
  derived: string[],
  prisma: CascadeLocationPrisma,
): Promise<void> {
  const existing = await prisma.discoveryPrefs.findFirst()

  if (existing) {
    let current: StoredLocationFilter = EMPTY_LOCATION_FILTER
    if (existing.locationFilter) {
      try {
        const raw = JSON.parse(existing.locationFilter)
        current = {
          derived: Array.isArray(raw.derived) ? raw.derived : [],
          allow: Array.isArray(raw.allow) ? raw.allow : [],
          block: Array.isArray(raw.block) ? raw.block : [],
          alwaysAllow: Array.isArray(raw.alwaysAllow) ? raw.alwaysAllow : [],
        }
      } catch {
        current = EMPTY_LOCATION_FILTER
      }
    }

    if (areDerivedTitlesEqual(current.derived, derived)) return

    await prisma.discoveryPrefs.update({
      where: { id: existing.id },
      data: { locationFilter: JSON.stringify({ ...current, derived }) },
    })
  } else {
    await prisma.discoveryPrefs.create({
      data: {
        portals: JSON.stringify([]),
        keywords: JSON.stringify([]),
        locationFilter: JSON.stringify({ derived, allow: [], block: [], alwaysAllow: [] }),
      },
    })
  }
}

// ── Title filter cascade ──────────────────────────────────────────────────────

export async function cascadeDerivedTitles(
  derived: string[],
  prisma: CascadePrisma,
): Promise<void> {
  const existing = await prisma.discoveryPrefs.findFirst()

  if (existing) {
    const current: TitleFilter = existing.titleFilter
      ? JSON.parse(existing.titleFilter)
      : { derived: [], custom: [], negative: [], seniorityBoost: DEFAULT_SENIORITY_BOOST }

    if (areDerivedTitlesEqual(current.derived, derived)) return

    await prisma.discoveryPrefs.update({
      where: { id: existing.id },
      data: { titleFilter: JSON.stringify({ ...current, derived }) },
    })
  } else {
    await prisma.discoveryPrefs.create({
      data: {
        portals: JSON.stringify([]),
        keywords: JSON.stringify([]),
        titleFilter: JSON.stringify({
          derived,
          custom: [],
          negative: [],
          seniorityBoost: DEFAULT_SENIORITY_BOOST,
        }),
      },
    })
  }
}
