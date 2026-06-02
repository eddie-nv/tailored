import type { PrismaClient, Profile, DiscoveryPrefs, ResumePrefs } from '@tailored/db'
import type { JobWithResumes } from '@tailored/db'

export interface AppState {
  jobs: JobWithResumes[]
  profile: Profile | null
  discoveryPrefs: DiscoveryPrefs | null
  resumePrefs: ResumePrefs | null
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
