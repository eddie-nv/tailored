'use client'

import { memo, useId } from 'react'
import type { Job, GeneratedResume } from '@tailored/db'
import { EvalReportRenderer } from './EvalReportRenderer'
import { StatusDropdown } from './StatusDropdown'
import { InlineNotesField } from './InlineNotesField'
import { ResumeMiniPreview } from './ResumeMiniPreview'

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
      <td colSpan={colSpan} className="p-0 border-b border-zinc-800/60">
        {/*
          We always render the panel so the transition plays on both open and close.
          The content is hidden from screen readers when collapsed via aria-hidden on the inner div.
        */}
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
              border border-zinc-700/50
              bg-zinc-900/80 shadow-lg shadow-black/20
              backdrop-blur-sm
            "
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-700/40">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-200">{job.company}</span>
                <span className="text-zinc-600">—</span>
                <span className="text-sm text-zinc-400">{job.role}</span>
                {job.score && (
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
                    {job.score}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onCollapse}
                aria-label="Collapse job details"
                className="
                  p-1 rounded text-zinc-500 hover:text-zinc-300
                  focus:outline-none focus:ring-1 focus:ring-indigo-500/60
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
            <div className="flex items-start gap-4 px-5 py-3 border-t border-zinc-700/40 bg-zinc-900/40 rounded-b-lg">
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
                    text-zinc-500 border border-zinc-700 bg-zinc-800/50
                    hover:text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800
                    focus:outline-none focus:ring-1 focus:ring-indigo-500/60
                    transition-colors
                  "
                >
                  Archive
                </button>
              )}
            </div>

            {/* Resume preview (additive — only when resumes exist) */}
            {job.resumes.length > 0 && (
              <div className="px-5 py-4 border-t border-zinc-700/40">
                <ResumeMiniPreview resumes={job.resumes} jobId={job.id} />
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
})
