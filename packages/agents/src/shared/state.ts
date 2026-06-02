import type { PrismaClient, Profile, DiscoveryPrefs, ResumePrefs, Job } from '@tailored/db'

export interface AppState {
  jobs: Job[]
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
    jobs,
    profile: profiles,
    discoveryPrefs,
    resumePrefs,
  }
}
