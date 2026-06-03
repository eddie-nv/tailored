'use client'

import { memo, useId } from 'react'
import type { Job, GeneratedResume } from '@tailored/db'
import { EvalReportRenderer } from './EvalReportRenderer'
import { StatusDropdown } from './StatusDropdown'
import { ResumeMiniPreview } from './ResumeMiniPreview'

type JobWithResumes = Job & { resumes: GeneratedResume[] }

interface ExpandedJobRowProps {
  job: JobWithResumes
  isExpanded: boolean
  colSpan: number
  onUpdateStatus: (jobId: string, status: string) => Promise<void>
  onArchive: (jobId: string) => void
}

export const ExpandedJobRow = memo(function ExpandedJobRow({
  job,
  isExpanded,
  colSpan,
  onUpdateStatus,
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
            className="mx-3 mb-3"
          >
            {/* Eval report */}
            <div className="px-5 py-4">
              <EvalReportRenderer evalReport={job.evalReport} />
            </div>

            {/* Footer: status + archive */}
            <div className="flex items-center gap-4 px-5 py-3 border-t border-[var(--border-divider)] bg-[var(--surface)]">
              <StatusDropdown
                jobId={job.id}
                status={job.status}
                onUpdate={onUpdateStatus}
              />
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

            {/* Resume history */}
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
