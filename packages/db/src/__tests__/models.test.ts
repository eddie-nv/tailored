import { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const prisma = new PrismaClient()

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.$disconnect()
})

beforeEach(async () => {
  await prisma.generatedResume.deleteMany()
  await prisma.job.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.discoveryPrefs.deleteMany()
  await prisma.resumePrefs.deleteMany()
})

// ─── Profile ────────────────────────────────────────────────────────────────

describe('Profile', () => {
  const base = {
    cv: '# John Doe\nSoftware Engineer',
    scoringWeights: JSON.stringify({ technical: 0.4, culture: 0.3, growth: 0.3 }),
  }

  it('creates a profile', async () => {
    const profile = await prisma.profile.create({ data: base })
    expect(profile.id).toBeTruthy()
    expect(profile.cv).toBe(base.cv)
    expect(profile.workType).toBeNull()
  })

  it('reads a profile by id', async () => {
    const created = await prisma.profile.create({ data: base })
    const found = await prisma.profile.findUnique({ where: { id: created.id } })
    expect(found?.cv).toBe(base.cv)
  })

  it('updates a profile', async () => {
    const created = await prisma.profile.create({ data: base })
    const updated = await prisma.profile.update({
      where: { id: created.id },
      data: { location: 'Remote', workType: 'remote' },
    })
    expect(updated.location).toBe('Remote')
    expect(updated.workType).toBe('remote')
  })

  it('deletes a profile', async () => {
    const created = await prisma.profile.create({ data: base })
    await prisma.profile.delete({ where: { id: created.id } })
    const found = await prisma.profile.findUnique({ where: { id: created.id } })
    expect(found).toBeNull()
  })
})

// ─── DiscoveryPrefs ──────────────────────────────────────────────────────────

describe('DiscoveryPrefs', () => {
  const base = {
    portals: JSON.stringify(['ashby', 'greenhouse', 'lever']),
    keywords: JSON.stringify(['TypeScript', 'AI', 'distributed systems']),
  }

  it('creates discovery prefs', async () => {
    const prefs = await prisma.discoveryPrefs.create({ data: base })
    expect(prefs.id).toBeTruthy()
    expect(prefs.minScore).toBeNull()
  })

  it('reads discovery prefs by id', async () => {
    const created = await prisma.discoveryPrefs.create({ data: base })
    const found = await prisma.discoveryPrefs.findUnique({ where: { id: created.id } })
    expect(found?.portals).toBe(base.portals)
  })

  it('updates discovery prefs', async () => {
    const created = await prisma.discoveryPrefs.create({ data: base })
    const updated = await prisma.discoveryPrefs.update({
      where: { id: created.id },
      data: { minScore: 'B' },
    })
    expect(updated.minScore).toBe('B')
  })

  it('deletes discovery prefs', async () => {
    const created = await prisma.discoveryPrefs.create({ data: base })
    await prisma.discoveryPrefs.delete({ where: { id: created.id } })
    const found = await prisma.discoveryPrefs.findUnique({ where: { id: created.id } })
    expect(found).toBeNull()
  })
})

// ─── ResumePrefs ─────────────────────────────────────────────────────────────

describe('ResumePrefs', () => {
  const base = {
    sectionOrder: JSON.stringify(['summary', 'experience', 'skills', 'education']),
    keywords: JSON.stringify(['TypeScript', 'systems design']),
  }

  it('creates resume prefs with defaults', async () => {
    const prefs = await prisma.resumePrefs.create({ data: base })
    expect(prefs.template).toBe('default')
    expect(prefs.tone).toBeNull()
  })

  it('reads resume prefs by id', async () => {
    const created = await prisma.resumePrefs.create({ data: base })
    const found = await prisma.resumePrefs.findUnique({ where: { id: created.id } })
    expect(found?.sectionOrder).toBe(base.sectionOrder)
  })

  it('updates resume prefs', async () => {
    const created = await prisma.resumePrefs.create({ data: base })
    const updated = await prisma.resumePrefs.update({
      where: { id: created.id },
      data: { template: 'minimal', tone: 'direct' },
    })
    expect(updated.template).toBe('minimal')
    expect(updated.tone).toBe('direct')
  })

  it('deletes resume prefs', async () => {
    const created = await prisma.resumePrefs.create({ data: base })
    await prisma.resumePrefs.delete({ where: { id: created.id } })
    const found = await prisma.resumePrefs.findUnique({ where: { id: created.id } })
    expect(found).toBeNull()
  })
})

// ─── Job ─────────────────────────────────────────────────────────────────────

describe('Job', () => {
  const base = {
    company: 'Anthropic',
    role: 'Staff Engineer',
    source: 'direct',
    url: 'https://anthropic.com/careers/staff-engineer',
  }

  it('creates a job with defaults', async () => {
    const job = await prisma.job.create({ data: base })
    expect(job.status).toBe('new')
    expect(job.score).toBeNull()
    expect(job.archetype).toBeNull()
  })

  it('reads a job by id', async () => {
    const created = await prisma.job.create({ data: base })
    const found = await prisma.job.findUnique({ where: { id: created.id } })
    expect(found?.company).toBe('Anthropic')
  })

  it('enforces unique url constraint', async () => {
    await prisma.job.create({ data: base })
    await expect(prisma.job.create({ data: base })).rejects.toThrow()
  })

  it('updates job score and archetype', async () => {
    const created = await prisma.job.create({ data: base })
    const updated = await prisma.job.update({
      where: { id: created.id },
      data: { score: 'A', archetype: 'Agentic', cvMatchPct: 87, status: 'reviewed' },
    })
    expect(updated.score).toBe('A')
    expect(updated.cvMatchPct).toBe(87)
    expect(updated.status).toBe('reviewed')
  })

  it('deletes a job', async () => {
    const created = await prisma.job.create({ data: base })
    await prisma.job.delete({ where: { id: created.id } })
    const found = await prisma.job.findUnique({ where: { id: created.id } })
    expect(found).toBeNull()
  })
})

// ─── GeneratedResume ─────────────────────────────────────────────────────────

describe('GeneratedResume', () => {
  it('creates a resume linked to a job', async () => {
    const job = await prisma.job.create({
      data: { company: 'OpenAI', role: 'Engineer', source: 'direct' },
    })
    const resume = await prisma.generatedResume.create({
      data: { jobId: job.id, filename: 'openai-engineer.pdf', path: '/resumes/openai-engineer.pdf' },
    })
    expect(resume.jobId).toBe(job.id)
  })

  it('cascade-deletes resumes when job is deleted', async () => {
    const job = await prisma.job.create({
      data: { company: 'Stripe', role: 'SRE', source: 'scan' },
    })
    await prisma.generatedResume.create({
      data: { jobId: job.id, filename: 'stripe-sre.pdf', path: '/resumes/stripe-sre.pdf' },
    })
    await prisma.job.delete({ where: { id: job.id } })
    const resumes = await prisma.generatedResume.findMany({ where: { jobId: job.id } })
    expect(resumes).toHaveLength(0)
  })

  it('reads resumes through job relation', async () => {
    const job = await prisma.job.create({
      data: { company: 'Vercel', role: 'DevRel', source: 'direct' },
    })
    await prisma.generatedResume.create({
      data: { jobId: job.id, filename: 'vercel-devrel.pdf', path: '/resumes/vercel-devrel.pdf' },
    })
    const found = await prisma.job.findUnique({
      where: { id: job.id },
      include: { resumes: true },
    })
    expect(found?.resumes).toHaveLength(1)
    expect(found?.resumes[0]?.filename).toBe('vercel-devrel.pdf')
  })

  it('deletes a resume without deleting the job', async () => {
    const job = await prisma.job.create({
      data: { company: 'Linear', role: 'PM', source: 'direct' },
    })
    const resume = await prisma.generatedResume.create({
      data: { jobId: job.id, filename: 'linear-pm.pdf', path: '/resumes/linear-pm.pdf' },
    })
    await prisma.generatedResume.delete({ where: { id: resume.id } })
    const jobStillExists = await prisma.job.findUnique({ where: { id: job.id } })
    expect(jobStillExists).not.toBeNull()
  })
})
