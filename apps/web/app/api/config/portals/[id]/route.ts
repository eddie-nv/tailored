import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@tailored/db/client'

const PatchSchema = z.object({
  enabled: z.boolean(),
})

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
      data: { enabled: parsed.data.enabled },
    })
    return NextResponse.json({ success: true, data: portal })
  } catch {
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
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete custom portal' },
      { status: 500 },
    )
  }
}
