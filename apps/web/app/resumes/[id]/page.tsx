import { notFound } from 'next/navigation'
import { prisma } from '@tailored/db/client'
import { ResumeViewer } from './ResumeViewer'

export default async function ResumePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Guard against non-CUID input before hitting the DB
  if (!id || !/^[a-z0-9]+$/.test(id) || id.length < 10 || id.length > 50) {
    notFound()
  }

  const resume = await prisma.generatedResume.findUnique({ where: { id } })
  if (!resume) notFound()

  const siblings = await prisma.generatedResume.findMany({
    where: { jobId: resume.jobId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })

  const versionIndex = siblings.findIndex((s) => s.id === id)
  const versionLabel = `Version ${versionIndex >= 0 ? versionIndex + 1 : 1}`

  const formattedDate = new Date(resume.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <ResumeViewer
      id={id}
      filename={resume.filename}
      versionLabel={versionLabel}
      formattedDate={formattedDate}
    />
  )
}
