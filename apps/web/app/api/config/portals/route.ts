import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@tailored/db/client'

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  url: z
    .string()
    .url()
    .refine((u) => u.startsWith('https://'), { message: 'URL must use https://' }),
  provider: z
    .enum(['Ashby', 'Greenhouse', 'Lever', 'Workable', 'SmartRecruiters', 'Recruitee'])
    .nullable()
    .optional(),
  api: z
    .string()
    .url()
    .refine((u) => u.startsWith('https://'), { message: 'API URL must use https://' })
    .nullable()
    .optional(),
  notes: z.string().max(200).nullable().optional(),
})

export async function GET() {
  try {
    const portals = await prisma.customPortal.findMany({ orderBy: { createdAt: 'asc' } })
    return NextResponse.json({ success: true, data: portals })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to load custom portals' },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 })
  }

  try {
    const portal = await prisma.customPortal.create({ data: parsed.data })
    return NextResponse.json({ success: true, data: portal }, { status: 201 })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create custom portal' },
      { status: 500 },
    )
  }
}
