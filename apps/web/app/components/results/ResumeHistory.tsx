'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import type { GeneratedResume } from '@tailored/db'

interface ResumeHistoryProps {
  resumes: GeneratedResume[]
  jobId: string
}

export const ResumeHistory = memo(function ResumeHistory({ resumes }: ResumeHistoryProps) {
  const router = useRouter()

  if (resumes.length === 0) return null

  const sorted = [...resumes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1">
        Resume History
      </h4>
      <ul role="list" className="flex flex-col gap-0.5">
        {sorted.map((resume, index) => (
          <li key={resume.id}>
            <button
              type="button"
              onClick={() => router.push(`/resumes/${resume.id}`)}
              className="
                w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-xs
                text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]
                focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/60
                transition-colors
              "
            >
              <span className="font-semibold text-[var(--foreground)] shrink-0">
                Version {index + 1}
              </span>
              <span className="text-[var(--text-faint)]" aria-hidden="true">—</span>
              <span className="truncate">{resume.filename}</span>
              <span className="shrink-0 text-[var(--text-faint)] ml-auto">
                {new Date(resume.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
})
