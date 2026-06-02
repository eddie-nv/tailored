export { PrismaClient } from '@prisma/client'
export type {
  Profile,
  DiscoveryPrefs,
  ResumePrefs,
  Job,
  GeneratedResume,
} from '@prisma/client'

import type { Job, GeneratedResume } from '@prisma/client'

/** Job with its generated resumes relation included */
export type JobWithResumes = Job & { resumes: GeneratedResume[] }
