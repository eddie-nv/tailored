import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@tailored/db/client'

const PatchSchema = z.object({
  cv: z.string().max(50000).optional(),
  targetRoles: z.array(z.string().max(100)).max(50).optional(),
  salaryMin: z.number().int().min(0).nullable().optional(),
  salaryMax: z.number().int().min(0).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  workType: z.enum(['remote', 'hybrid', 'onsite']).nullable().optional(),
})

export async function GET() {
  try {
    const profile = await prisma.profile.findFirst()
    return NextResponse.json({ success: true, data: profile })
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

  const { cv, targetRoles, salaryMin, salaryMax, location, workType } = parsed.data
  const updateData: Record<string, unknown> = {}

  if (cv !== undefined) updateData.cv = cv
  if (targetRoles !== undefined) updateData.targetRoles = JSON.stringify(targetRoles)
  if (salaryMin !== undefined) updateData.salaryMin = salaryMin
  if (salaryMax !== undefined) updateData.salaryMax = salaryMax
  if (location !== undefined) updateData.location = location
  if (workType !== undefined) updateData.workType = workType

  try {
    const existing = await prisma.profile.findFirst()
    const profile = existing
      ? await prisma.profile.update({ where: { id: existing.id }, data: updateData })
      : await prisma.profile.create({
          data: {
            cv: typeof cv === 'string' ? cv : '',
            targetRoles: JSON.stringify(targetRoles ?? []),
            scoringWeights: JSON.stringify({}),
            ...updateData,
          },
        })

    return NextResponse.json({ success: true, data: profile })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to save profile' }, { status: 500 })
  }
}
