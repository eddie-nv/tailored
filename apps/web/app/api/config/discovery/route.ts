import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@tailored/db/client'

const PatchSchema = z.object({
  portals: z.array(z.string()).optional(),
  keywords: z.array(z.string().max(100)).max(100).optional(),
  archetypes: z.array(z.string().max(100)).max(20).optional(),
  minScore: z.enum(['A', 'B', 'C', 'D', 'F']).nullable().optional(),
})

export async function GET() {
  try {
    const prefs = await prisma.discoveryPrefs.findFirst()
    return NextResponse.json({ success: true, data: prefs })
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

  const { portals, keywords, archetypes, minScore } = parsed.data
  const updateData: Record<string, unknown> = {}

  if (portals !== undefined) updateData.portals = JSON.stringify(portals)
  if (keywords !== undefined) updateData.keywords = JSON.stringify(keywords)
  if (archetypes !== undefined) updateData.archetypes = JSON.stringify(archetypes)
  if (minScore !== undefined) updateData.minScore = minScore

  try {
    const existing = await prisma.discoveryPrefs.findFirst()
    const prefs = existing
      ? await prisma.discoveryPrefs.update({ where: { id: existing.id }, data: updateData })
      : await prisma.discoveryPrefs.create({
          data: {
            portals: JSON.stringify(portals ?? []),
            keywords: JSON.stringify(keywords ?? []),
            archetypes: JSON.stringify(archetypes ?? []),
            ...updateData,
          },
        })

    return NextResponse.json({ success: true, data: prefs })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to save discovery prefs' },
      { status: 500 },
    )
  }
}
