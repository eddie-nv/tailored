export type StoredLocationFilter = {
  derived: string[]
  allow: string[]
  block: string[]
  alwaysAllow: string[]
}

export type ProfileLocationFields = {
  workType?: string | null
  location?: string | null
  locationFlexibility?: string | null
}

export function computeDerivedLocations(profile: ProfileLocationFields): string[] {
  const hints: string[] = []

  if (profile.workType === 'remote') {
    hints.push('Remote')
  } else if (profile.workType === 'hybrid') {
    hints.push('Remote', 'Hybrid')
  }
  // 'onsite' produces no location hints

  const loc = profile.location?.trim()
  if (loc) hints.push(loc)

  const flex = profile.locationFlexibility?.trim()
  if (flex) hints.push(flex)

  // Dedup preserving order
  return [...new Set(hints)]
}
