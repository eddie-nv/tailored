import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@tailored/db/client'

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  query: z.string().min(1).max(500),
})

export async function GET() {
  try {
    const queries = await prisma.searchQuery.findMany({ orderBy: { createdAt: 'asc' } })
    return NextResponse.json({ success: true, data: queries })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to load search queries' },
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
    const query = await prisma.searchQuery.create({ data: parsed.data })
    return NextResponse.json({ success: true, data: query }, { status: 201 })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create search query' },
      { status: 500 },
    )
  }
}
