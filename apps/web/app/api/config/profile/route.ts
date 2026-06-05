import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@tailored/db/client'

const PatchSchema = z.object({
  // existing
  cv: z.string().max(50000).optional(),
  targetRoles: z.array(z.string().max(100)).max(50).optional(),
  salaryMin: z.number().int().min(0).nullable().optional(),
  salaryMax: z.number().int().min(0).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  workType: z.enum(['remote', 'hybrid', 'onsite']).nullable().optional(),
  // identity
  fullName: z.string().max(200).nullable().optional(),
  email: z.string().max(200).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  linkedin: z.string().max(500).nullable().optional(),
  portfolioUrl: z.string().max(500).nullable().optional(),
  github: z.string().max(500).nullable().optional(),
  twitter: z.string().max(500).nullable().optional(),
  // narrative
  headline: z.string().max(500).nullable().optional(),
  exitStory: z.string().max(5000).nullable().optional(),
  superpowers: z.array(z.string().max(200)).nullable().optional(),
  // compensation extras
  currency: z.string().max(10).nullable().optional(),
  salaryFloor: z.number().int().min(0).nullable().optional(),
  locationFlexibility: z.string().max(200).nullable().optional(),
  // location / auth
  timezone: z.string().max(100).nullable().optional(),
  visaStatus: z.string().max(200).nullable().optional(),
  onsiteAvailability: z.string().max(200).nullable().optional(),
  // target roles archetypes
  archetypes: z.array(z.object({
    name: z.string().max(200),
    level: z.string().max(100),
    fit: z.enum(['primary', 'secondary', 'adjacent']),
  })).nullable().optional(),
  // proof points
  proofPoints: z.array(z.object({
    name: z.string().max(200),
    url: z.string().max(500),
    heroMetric: z.string().max(500),
  })).nullable().optional(),
  // cv output
  cvFormat: z.enum(['html', 'latex']).nullable().optional(),
  canvaDesignId: z.string().max(200).nullable().optional(),
  autoPdfThreshold: z.number().min(0).max(5).nullable().optional(),
})

export async function GET() {
  try {
    const profile = await prisma.profile.findFirst()
    if (!profile) {
      return NextResponse.json({ success: true, data: null })
    }
    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        targetRoles: JSON.parse(profile.targetRoles ?? '[]'),
        scoringWeights: JSON.parse(profile.scoringWeights ?? '{}'),
        superpowers: profile.superpowers ? JSON.parse(profile.superpowers) : null,
        archetypes: profile.archetypes ? JSON.parse(profile.archetypes) : null,
        proofPoints: profile.proofPoints ? JSON.parse(profile.proofPoints) : null,
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 })
  }

  const data = parsed.data
  const updateData: Record<string, unknown> = {}

  if (data.cv !== undefined) updateData.cv = data.cv
  if (data.targetRoles !== undefined) updateData.targetRoles = JSON.stringify(data.targetRoles)
  if (data.salaryMin !== undefined) updateData.salaryMin = data.salaryMin
  if (data.salaryMax !== undefined) updateData.salaryMax = data.salaryMax
  if (data.location !== undefined) updateData.location = data.location
  if (data.workType !== undefined) updateData.workType = data.workType
  // identity
  if (data.fullName !== undefined) updateData.fullName = data.fullName
  if (data.email !== undefined) updateData.email = data.email
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.linkedin !== undefined) updateData.linkedin = data.linkedin
  if (data.portfolioUrl !== undefined) updateData.portfolioUrl = data.portfolioUrl
  if (data.github !== undefined) updateData.github = data.github
  if (data.twitter !== undefined) updateData.twitter = data.twitter
  // narrative
  if (data.headline !== undefined) updateData.headline = data.headline
  if (data.exitStory !== undefined) updateData.exitStory = data.exitStory
  if (data.superpowers !== undefined) updateData.superpowers = data.superpowers === null ? null : JSON.stringify(data.superpowers)
  // compensation extras
  if (data.currency !== undefined) updateData.currency = data.currency
  if (data.salaryFloor !== undefined) updateData.salaryFloor = data.salaryFloor
  if (data.locationFlexibility !== undefined) updateData.locationFlexibility = data.locationFlexibility
  // location / auth
  if (data.timezone !== undefined) updateData.timezone = data.timezone
  if (data.visaStatus !== undefined) updateData.visaStatus = data.visaStatus
  if (data.onsiteAvailability !== undefined) updateData.onsiteAvailability = data.onsiteAvailability
  // target roles archetypes
  if (data.archetypes !== undefined) updateData.archetypes = data.archetypes === null ? null : JSON.stringify(data.archetypes)
  // proof points
  if (data.proofPoints !== undefined) updateData.proofPoints = data.proofPoints === null ? null : JSON.stringify(data.proofPoints)
  // cv output
  if (data.cvFormat !== undefined) updateData.cvFormat = data.cvFormat
  if (data.canvaDesignId !== undefined) updateData.canvaDesignId = data.canvaDesignId
  if (data.autoPdfThreshold !== undefined) updateData.autoPdfThreshold = data.autoPdfThreshold

  try {
    const existing = await prisma.profile.findFirst()
    const profile = existing
      ? await prisma.profile.update({ where: { id: existing.id }, data: updateData })
      : await prisma.profile.create({
          data: {
            cv: typeof data.cv === 'string' ? data.cv : '',
            targetRoles: JSON.stringify(data.targetRoles ?? []),
            scoringWeights: JSON.stringify({}),
            ...updateData,
          },
        })

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        targetRoles: JSON.parse(profile.targetRoles ?? '[]'),
        scoringWeights: JSON.parse(profile.scoringWeights ?? '{}'),
        superpowers: profile.superpowers ? JSON.parse(profile.superpowers) : null,
        archetypes: profile.archetypes ? JSON.parse(profile.archetypes) : null,
        proofPoints: profile.proofPoints ? JSON.parse(profile.proofPoints) : null,
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to save profile' }, { status: 500 })
  }
}
