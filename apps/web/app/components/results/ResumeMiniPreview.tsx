'use client'

import { memo } from 'react'
import type { GeneratedResume } from '@tailored/db'

interface ResumeMiniPreviewProps {
  resumes: GeneratedResume[]
  jobId: string
}

export const ResumeMiniPreview = memo(function ResumeMiniPreview({
  resumes,
  jobId,
}: ResumeMiniPreviewProps) {
  if (resumes.length === 0) return null

  const resume = resumes[resumes.length - 1]!
  const previewUrl = `/api/resumes/${resume.id}`

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Resume Preview
        </h4>
        <a
          href={previewUrl}
          download={resume.filename}
          aria-label="Download resume"
          className="
            inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium
            bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30
            hover:bg-[var(--accent)]/15 hover:text-[var(--accent-hover)]
            focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/60
            transition-colors
          "
        >
          <svg
            aria-hidden="true"
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
          Download
        </a>
      </div>
      <iframe
        src={previewUrl}
        title={`Resume preview for job ${jobId}`}
        className="w-full rounded border border-[var(--border-subtle)] bg-white"
        style={{ height: 400 }}
        aria-label="Resume PDF preview"
      />
    </div>
  )
})
