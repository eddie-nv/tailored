export type StoredTitleFilter = {
  derived: string[]
  custom: string[]
  negative: string[]
  seniorityBoost: string[]
}

export type StoredLocationFilter = {
  derived: string[]
  allow: string[]
  block: string[]
  alwaysAllow: string[]
}

export function parseTitleFilter(raw: string | null): StoredTitleFilter {
  if (!raw) return { derived: [], custom: [], negative: [], seniorityBoost: [] }
  try {
    const parsed = JSON.parse(raw) as Partial<StoredTitleFilter>
    return {
      derived: Array.isArray(parsed.derived) ? parsed.derived : [],
      custom: Array.isArray(parsed.custom) ? parsed.custom : [],
      negative: Array.isArray(parsed.negative) ? parsed.negative : [],
      seniorityBoost: Array.isArray(parsed.seniorityBoost) ? parsed.seniorityBoost : [],
    }
  } catch {
    return { derived: [], custom: [], negative: [], seniorityBoost: [] }
  }
}

export function parseLocationFilter(raw: string | null): StoredLocationFilter {
  if (!raw) return { derived: [], allow: [], block: [], alwaysAllow: [] }
  try {
    const parsed = JSON.parse(raw) as Partial<StoredLocationFilter>
    return {
      derived: Array.isArray(parsed.derived) ? parsed.derived : [],
      allow: Array.isArray(parsed.allow) ? parsed.allow : [],
      block: Array.isArray(parsed.block) ? parsed.block : [],
      alwaysAllow: Array.isArray(parsed.alwaysAllow) ? parsed.alwaysAllow : [],
    }
  } catch {
    return { derived: [], allow: [], block: [], alwaysAllow: [] }
  }
}

export function matchesTitleFilter(
  title: string,
  positive: string[],
  negative: string[],
): boolean {
  const lower = title.toLowerCase()
  if (negative.some((kw) => lower.includes(kw.toLowerCase()))) return false
  if (positive.length === 0) return true
  return positive.some((kw) => lower.includes(kw.toLowerCase()))
}

export function isSeniorityBoosted(title: string, seniorityBoost: string[]): boolean {
  const lower = title.toLowerCase()
  return seniorityBoost.some((prefix) => lower.startsWith(prefix.toLowerCase()))
}

export function matchesLocationFilter(
  location: string | undefined,
  filter: StoredLocationFilter,
): boolean {
  if (!location?.trim()) return true

  const lower = location.toLowerCase()
  const effectiveAllow = [...filter.derived, ...filter.allow]

  // alwaysAllow rescues even blocked locations — check first
  if (filter.alwaysAllow.some((kw) => lower.includes(kw.toLowerCase()))) return true

  // block: any match = reject
  if (filter.block.some((kw) => lower.includes(kw.toLowerCase()))) return false

  // effective allow (derived + explicit allow): if non-empty, at least one must match
  if (effectiveAllow.length > 0) {
    return effectiveAllow.some((kw) => lower.includes(kw.toLowerCase()))
  }

  return true
}
