import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@tailored/db/client'

const CreateJobSchema = z.object({
  url: z.string().url().optional(),
  description: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  source: z.enum(['direct', 'scan']).default('direct'),
})

export async function GET() {
  const jobs = await prisma.job.findMany({
    include: { resumes: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ success: true, data: jobs })
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreateJobSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.message },
      { status: 400 },
    )
  }

  const { url, company, role, source } = parsed.data

  // Placeholder company/role — EvaluationAgent will update these during step 1
  const job = await prisma.job.create({
    data: {
      url: url ?? null,
      company: company ?? 'Evaluating...',
      role: role ?? 'Evaluating...',
      source,
      status: 'new',
    },
  })

  return NextResponse.json({ success: true, data: job }, { status: 201 })
}
