import { readFileSync } from 'fs'
import { resolve } from 'path'
import { prisma } from '@tailored/db/client'

function getOutputDir(): string {
  const envDir = process.env['RESUME_OUTPUT_DIR']
  if (envDir) {
    return resolve(envDir)
  }
  return resolve(process.cwd(), 'apps/web/public/resumes')
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params

  if (!id || typeof id !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing resume id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Look up the resume record to get the stored path
  const record = await prisma.generatedResume.findUnique({ where: { id } })

  if (!record) {
    return new Response(JSON.stringify({ error: 'Resume not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Path traversal guard: the stored path must be inside RESUME_OUTPUT_DIR
  const outputDir = getOutputDir()
  const resolvedPath = resolve(record.path)

  if (!resolvedPath.startsWith(outputDir + '/') && resolvedPath !== outputDir) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let pdfBuffer: Buffer
  try {
    pdfBuffer = readFileSync(resolvedPath)
  } catch {
    return new Response(JSON.stringify({ error: 'File not found on disk' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${record.filename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
