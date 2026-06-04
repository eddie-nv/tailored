'use client'

import { memo, useId } from 'react'
import { Box, Group, UnstyledButton } from '@mantine/core'
import type { Job, GeneratedResume } from '@tailored/db'
import { EvalReportRenderer } from './EvalReportRenderer'
import { StatusDropdown } from './StatusDropdown'
import { ResumeHistory } from './ResumeHistory'

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
      <td colSpan={colSpan} style={{ padding: 0, borderBottom: '1px solid var(--border-divider)' }}>
        <div
          style={{
            maxHeight: isExpanded ? 900 : 0,
            overflow: 'hidden',
            transition: 'max-height 350ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <Box
            id={panelId}
            role="region"
            aria-label="Job details"
            inert={!isExpanded || undefined}
            style={{ margin: '0 12px 12px' }}
          >
            <Box p="16px 20px">
              <EvalReportRenderer evalReport={job.evalReport} />
            </Box>

            <Group
              gap={16}
              p="12px 20px"
              bg="var(--surface)"
              style={{ borderTop: '1px solid var(--border-divider)' }}
            >
              <StatusDropdown jobId={job.id} status={job.status} onUpdate={onUpdateStatus} />
              {job.status !== 'archived' && (
                <UnstyledButton type="button" onClick={() => onArchive(job.id)} className="archive-btn">
                  Archive
                </UnstyledButton>
              )}
            </Group>

            {job.resumes.length > 0 && (
              <Box p="16px 20px" style={{ borderTop: '1px solid var(--border-divider)' }}>
                <ResumeHistory resumes={job.resumes} jobId={job.id} />
              </Box>
            )}
          </Box>
        </div>
      </td>
    </tr>
  )
})
