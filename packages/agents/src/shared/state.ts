import type { PrismaClient, Profile, DiscoveryPrefs, ResumePrefs } from '@tailored/db'
import type { JobWithResumes } from '@tailored/db'

export interface AppState {
  jobs: JobWithResumes[]
  profile: Profile | null
  discoveryPrefs: DiscoveryPrefs | null
  resumePrefs: ResumePrefs | null
}

export interface ProofPoint {
  name: string
  url: string
  heroMetric: string
}

export function parseProofPoints(profile: Pick<Profile, 'proofPoints'> | null): ProofPoint[] {
  if (!profile?.proofPoints) return []
  try {
    const parsed: unknown = JSON.parse(profile.proofPoints)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (p): p is ProofPoint =>
        typeof p === 'object' &&
        p !== null &&
        typeof (p as Record<string, unknown>).name === 'string' &&
        ((p as Record<string, unknown>).name as string).length > 0 &&
        typeof (p as Record<string, unknown>).heroMetric === 'string' &&
        ((p as Record<string, unknown>).heroMetric as string).length > 0,
    )
  } catch {
    return []
  }
}

export async function loadAppState(db: PrismaClient): Promise<AppState> {
  const [jobs, profiles, discoveryPrefs, resumePrefs] = await Promise.all([
    db.job.findMany({ include: { resumes: true }, orderBy: { createdAt: 'desc' } }),
    db.profile.findFirst(),
    db.discoveryPrefs.findFirst(),
    db.resumePrefs.findFirst(),
  ])

  return {
    jobs: jobs as JobWithResumes[],
    profile: profiles,
    discoveryPrefs,
    resumePrefs,
  }
}
