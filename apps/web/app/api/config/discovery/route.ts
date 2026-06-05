import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@tailored/db/client'

const DEFAULT_SENIORITY_BOOST = ['Senior', 'Staff', 'Principal', 'Lead', 'Head', 'Director']

const TitleFilterSchema = z.object({
  custom: z.array(z.string().max(200)).max(100).optional(),
  negative: z.array(z.string().max(200)).max(100).optional(),
  seniorityBoost: z.array(z.string().max(100)).max(20).optional(),
})

const PatchSchema = z.object({
  portals: z.array(z.string()).optional(),
  keywords: z.array(z.string().max(100)).max(100).optional(),
  titleFilter: TitleFilterSchema.optional(),
  minScore: z.enum(['A', 'B', 'C', 'D', 'F']).nullable().optional(),
})

type StoredTitleFilter = {
  derived: string[]
  custom: string[]
  negative: string[]
  seniorityBoost: string[]
}

function parseStoredTitleFilter(raw: string | null): StoredTitleFilter {
  if (!raw) {
    return { derived: [], custom: [], negative: [], seniorityBoost: DEFAULT_SENIORITY_BOOST }
  }
  const parsed = JSON.parse(raw)
  return {
    derived: Array.isArray(parsed.derived) ? parsed.derived : [],
    custom: Array.isArray(parsed.custom) ? parsed.custom : [],
    negative: Array.isArray(parsed.negative) ? parsed.negative : [],
    seniorityBoost: Array.isArray(parsed.seniorityBoost)
      ? parsed.seniorityBoost
      : DEFAULT_SENIORITY_BOOST,
  }
}

export async function GET() {
  try {
    const prefs = await prisma.discoveryPrefs.findFirst()
    if (!prefs) {
      return NextResponse.json({ success: true, data: null })
    }

    const titleFilter = parseStoredTitleFilter(prefs.titleFilter)

    return NextResponse.json({
      success: true,
      data: {
        ...prefs,
        keywords: JSON.parse(prefs.keywords ?? '[]'),
        portals: JSON.parse(prefs.portals ?? '[]'),
        titleFilter,
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to load discovery prefs' },
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

  const { portals, keywords, titleFilter: titleFilterPatch, minScore } = parsed.data
  const updateData: Record<string, unknown> = {}

  if (portals !== undefined) updateData.portals = JSON.stringify(portals)
  if (keywords !== undefined) updateData.keywords = JSON.stringify(keywords)
  if (minScore !== undefined) updateData.minScore = minScore

  try {
    const existing = await prisma.discoveryPrefs.findFirst()

    if (titleFilterPatch !== undefined) {
      const current = parseStoredTitleFilter(existing?.titleFilter ?? null)
      const merged: StoredTitleFilter = {
        derived: current.derived,
        custom: titleFilterPatch.custom ?? current.custom,
        negative: titleFilterPatch.negative ?? current.negative,
        seniorityBoost: titleFilterPatch.seniorityBoost ?? current.seniorityBoost,
      }
      updateData.titleFilter = JSON.stringify(merged)
    }

    const prefs = existing
      ? await prisma.discoveryPrefs.update({ where: { id: existing.id }, data: updateData })
      : await prisma.discoveryPrefs.create({
          data: {
            portals: JSON.stringify(portals ?? []),
            keywords: JSON.stringify(keywords ?? []),
            titleFilter: JSON.stringify({
              derived: [],
              custom: titleFilterPatch?.custom ?? [],
              negative: titleFilterPatch?.negative ?? [],
              seniorityBoost: titleFilterPatch?.seniorityBoost ?? DEFAULT_SENIORITY_BOOST,
            }),
            ...updateData,
          },
        })

    const titleFilter = parseStoredTitleFilter(prefs.titleFilter)

    return NextResponse.json({
      success: true,
      data: {
        ...prefs,
        keywords: JSON.parse(prefs.keywords ?? '[]'),
        portals: JSON.parse(prefs.portals ?? '[]'),
        titleFilter,
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to save discovery prefs' },
      { status: 500 },
    )
  }
}
