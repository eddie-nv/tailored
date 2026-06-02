import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@tailored/db/client'

const DEFAULT_SECTION_ORDER = ['summary', 'experience', 'skills', 'education', 'projects', 'certifications']

const PatchSchema = z.object({
  template: z.enum(['default', 'minimal', 'dense']).optional(),
  sectionOrder: z.array(z.string()).optional(),
  tone: z.string().max(200).nullable().optional(),
  keywords: z.array(z.string().max(100)).max(100).optional(),
})

export async function GET() {
  try {
    const prefs = await prisma.resumePrefs.findFirst()
    return NextResponse.json({ success: true, data: prefs })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to load resume prefs' },
      { status: 500 },
    )
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

  const { template, sectionOrder, tone, keywords } = parsed.data
  const updateData: Record<string, unknown> = {}

  if (template !== undefined) updateData.template = template
  if (sectionOrder !== undefined) updateData.sectionOrder = JSON.stringify(sectionOrder)
  if (tone !== undefined) updateData.tone = tone
  if (keywords !== undefined) updateData.keywords = JSON.stringify(keywords)

  try {
    const existing = await prisma.resumePrefs.findFirst()
    const prefs = existing
      ? await prisma.resumePrefs.update({ where: { id: existing.id }, data: updateData })
      : await prisma.resumePrefs.create({
          data: {
            sectionOrder: JSON.stringify(DEFAULT_SECTION_ORDER),
            keywords: JSON.stringify(keywords ?? []),
            ...updateData,
          },
        })

    return NextResponse.json({ success: true, data: prefs })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to save resume prefs' },
      { status: 500 },
    )
  }
}
