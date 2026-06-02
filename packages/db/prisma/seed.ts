import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.profile.upsert({
    where: { id: 'seed-profile' },
    create: {
      id: 'seed-profile',
      cv: '# Jane Smith\n\nSenior Software Engineer with 8 years building distributed systems and AI applications.',
      targetRoles: JSON.stringify(['Staff Engineer', 'Principal Engineer', 'Engineering Manager']),
      salaryMin: 180000,
      salaryMax: 280000,
      location: 'San Francisco, CA',
      workType: 'hybrid',
      scoringWeights: JSON.stringify({
        technical: 0.35,
        culture: 0.25,
        growth: 0.20,
        compensation: 0.20,
      }),
    },
    update: {},
  })

  await prisma.discoveryPrefs.upsert({
    where: { id: 'seed-discovery' },
    create: {
      id: 'seed-discovery',
      portals: JSON.stringify(['ashby', 'greenhouse', 'lever', 'wellfound']),
      keywords: JSON.stringify(['TypeScript', 'distributed systems', 'AI', 'LLM']),
      archetypes: JSON.stringify(['LLMOps', 'Agentic', 'FDE']),
      minScore: 'B',
    },
    update: {},
  })

  await prisma.resumePrefs.upsert({
    where: { id: 'seed-resume' },
    create: {
      id: 'seed-resume',
      template: 'default',
      sectionOrder: JSON.stringify(['summary', 'experience', 'skills', 'education', 'projects']),
      tone: 'direct',
      keywords: JSON.stringify(['TypeScript', 'systems design', 'distributed systems']),
    },
    update: {},
  })

  const jobs = [
    {
      company: 'Anthropic',
      role: 'Staff Engineer, AI Infrastructure',
      url: 'https://anthropic.com/careers/staff-engineer-ai-infra',
      source: 'direct',
      archetype: 'LLMOps',
      score: 'A',
      cvMatchPct: 91,
      status: 'reviewed',
      evalReport: JSON.stringify({
        roleSummary: 'Core infrastructure for Claude model serving.',
        cvMatch: 'Strong alignment on distributed systems and AI tooling.',
        levelStrategy: 'Target L5/Staff level. Position yourself on LLM reliability.',
        compensation: 'Expected $250-300k total comp.',
        personalization: 'Highlight experience with model serving pipelines.',
        interviewPrep: 'Expect systems design + ML infrastructure questions.',
      }),
    },
    {
      company: 'Vercel',
      role: 'Principal Engineer, Platform',
      url: 'https://vercel.com/careers/principal-engineer-platform',
      source: 'scan',
      archetype: 'FDE',
      score: 'B+',
      cvMatchPct: 78,
      status: 'new',
    },
    {
      company: 'Linear',
      role: 'Senior Software Engineer',
      url: 'https://linear.app/careers/senior-engineer',
      source: 'scan',
      status: 'new',
    },
  ]

  for (const job of jobs) {
    await prisma.job.upsert({
      where: { url: job.url },
      create: job,
      update: {},
    })
  }

  console.log('Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
