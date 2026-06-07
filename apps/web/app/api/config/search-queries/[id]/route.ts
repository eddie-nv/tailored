import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@tailored/db/client'
import { isPrismaNotFound } from '@/app/lib/prisma-errors'

const PatchSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    query: z.string().min(1).max(500).optional(),
    enabled: z.boolean().optional(),
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
    const query = await prisma.searchQuery.update({
      where: { id },
      data: parsed.data,
    })
    return NextResponse.json({ success: true, data: query })
  } catch (err) {
    if (isPrismaNotFound(err)) {
      return NextResponse.json({ success: false, error: 'Search query not found' }, { status: 404 })
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update search query' },
      { status: 500 },
    )
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    await prisma.searchQuery.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    if (isPrismaNotFound(err)) {
      return NextResponse.json({ success: false, error: 'Search query not found' }, { status: 404 })
    }
    return NextResponse.json(
      { success: false, error: 'Failed to delete search query' },
      { status: 500 },
    )
  }
}
