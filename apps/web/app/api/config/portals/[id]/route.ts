import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@tailored/db/client'
import { isPrismaNotFound } from '@/app/lib/prisma-errors'

const PatchSchema = z
  .object({
    enabled: z.boolean().optional(),
    method: z.enum(['auto', 'websearch']).optional(),
    query: z.string().max(500).nullable().optional(),
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
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, { message: 'At least one field must be provided' })

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

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

  try {
    const portal = await prisma.customPortal.update({
      where: { id },
      data: parsed.data,
    })
    return NextResponse.json({ success: true, data: portal })
  } catch (err) {
    if (isPrismaNotFound(err)) {
      return NextResponse.json({ success: false, error: 'Portal not found' }, { status: 404 })
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update custom portal' },
      { status: 500 },
    )
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    await prisma.customPortal.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (isPrismaNotFound(err)) {
      return NextResponse.json({ success: false, error: 'Portal not found' }, { status: 404 })
    }
    return NextResponse.json(
      { success: false, error: 'Failed to delete custom portal' },
      { status: 500 },
    )
  }
}

