'use client'

import { memo, useId } from 'react'
import type { Job, GeneratedResume } from '@tailored/db'
import { EvalReportRenderer } from './EvalReportRenderer'
import { StatusDropdown } from './StatusDropdown'
import { InlineNotesField } from './InlineNotesField'
import { ResumeMiniPreview } from './ResumeMiniPreview'
import { scoreStyle } from '@/app/lib/scoreStyles'

type JobWithResumes = Job & { resumes: GeneratedResume[] }

interface ExpandedJobRowProps {
  job: JobWithResumes
  isExpanded: boolean
  colSpan: number
  onCollapse: () => void
  onUpdateStatus: (jobId: string, status: string) => Promise<void>
  onUpdateNotes: (jobId: string, notes: string) => Promise<void>
  onArchive: (jobId: string) => void
}

export const ExpandedJobRow = memo(function ExpandedJobRow({
  job,
  isExpanded,
  colSpan,
  onCollapse,
  onUpdateStatus,
  onUpdateNotes,
  onArchive,
}: ExpandedJobRowProps) {
  const panelId = useId()

  return (
    <tr role="presentation">
      <td colSpan={colSpan} className="p-0 border-b border-[var(--border-divider)]">
        <div
          style={{
            maxHeight: isExpanded ? '900px' : '0px',
            overflow: 'hidden',
            transition: 'max-height 350ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            id={panelId}
            role="region"
            aria-label="Job details"
            inert={!isExpanded}
            className="
              mx-3 mb-3 rounded-lg
              border border-[var(--border-subtle)]
              bg-white shadow-md
            "
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-divider)]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--foreground)]">{job.company}</span>
                <span className="text-[var(--text-faint)]">—</span>
                <span className="text-sm text-[var(--text-muted)]">{job.role}</span>
                {job.score && (
                  <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${scoreStyle(job.score)}`}>
                    {job.score}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onCollapse}
                aria-label="Collapse job details"
                className="
                  p-1 rounded text-[var(--text-faint)] hover:text-[var(--foreground)]
                  focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/60
                  transition-colors
                "
              >
                <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>

            {/* Eval report */}
            <div className="px-5 py-4">
              <EvalReportRenderer evalReport={job.evalReport} />
            </div>

            {/* Footer: status + notes + archive */}
            <div className="flex items-start gap-4 px-5 py-3 border-t border-[var(--border-divider)] bg-[var(--surface)] rounded-b-lg">
              <StatusDropdown
                jobId={job.id}
                status={job.status}
                onUpdate={onUpdateStatus}
              />
              <div className="flex-1 min-w-0">
                <InlineNotesField
                  jobId={job.id}
                  notes={job.notes}
                  onUpdate={onUpdateNotes}
                />
              </div>
              {job.status !== 'archived' && (
                <button
                  type="button"
                  onClick={() => onArchive(job.id)}
                  className="
                    shrink-0 rounded px-2.5 py-1 text-xs font-medium
                    text-[var(--text-muted)] border border-[var(--border)] bg-[var(--surface-sunken)]
                    hover:text-[var(--foreground)] hover:border-[var(--text-faint)] hover:bg-[var(--border-divider)]
                    focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/60
                    transition-colors
                  "
                >
                  Archive
                </button>
              )}
            </div>

            {/* Resume preview */}
            {job.resumes.length > 0 && (
              <div className="px-5 py-4 border-t border-[var(--border-divider)]">
                <ResumeMiniPreview resumes={job.resumes} jobId={job.id} />
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
})
