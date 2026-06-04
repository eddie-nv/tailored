'use client'

import { memo, useCallback, useState, useId, useEffect, useRef, type CSSProperties } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ActionIcon, Badge, Center, Checkbox, Group, Menu, Stack, Text } from '@mantine/core'
import type { JobWithResumes } from '@tailored/db'
import { EvalStatusCell } from './EvalStatusCell'
import { ResumeCell } from './ResumeCell'
import { ExpandedJobRow } from './ExpandedJobRow'

const VIRTUALIZE_THRESHOLD = 100
const ESTIMATED_ROW_HEIGHT = 46

const ARCHETYPE_STYLE: Record<string, CSSProperties> = {
  LLMOps:         { background: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed' },
  Agentic:        { background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' },
  PM:             { background: 'rgba(14, 165, 233, 0.1)', color: '#0284c7' },
  SA:             { background: 'rgba(20, 184, 166, 0.1)', color: '#0d9488' },
  FDE:            { background: 'rgba(16, 185, 129, 0.1)', color: '#059669' },
  Transformation: { background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' },
}

const TH_STYLE: CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: '0.7rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const TD_STYLE: CSSProperties = { padding: '10px 12px' }

const COL_SPAN = 8

interface JobTableProps {
  jobs: JobWithResumes[]
  selectedIds: Set<string>
  activeEvalSteps: Map<string, string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: (visibleIds: string[]) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onUpdateStatus: (jobId: string, status: string) => Promise<void>
}

export function JobTable({
  jobs,
  selectedIds,
  activeEvalSteps,
  onToggleSelect,
  onToggleSelectAll,
  onArchive,
  onDelete,
  onUpdateStatus,
}: JobTableProps) {
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedJobId((prev) => (prev === id ? null : id))
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedJobId !== null) setExpandedJobId(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [expandedJobId])

  const shouldVirtualize = jobs.length >= VIRTUALIZE_THRESHOLD && expandedJobId === null

  const virtualizer = useVirtualizer({
    count: jobs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    enabled: shouldVirtualize,
    overscan: 10,
  })

  if (jobs.length === 0) {
    return (
      <Center role="status" p="64px 24px" style={{ flex: 1 }}>
        <Stack align="center" gap={8} ta="center" style={{ userSelect: 'none', color: 'var(--text-faint)' }}>
          <Text fz="1.875rem" aria-hidden="true">📋</Text>
          <Text size="sm" fw={500} c="var(--text-muted)">No jobs yet</Text>
          <Text size="xs" c="var(--text-faint)">Paste a job URL above or scan portals to get started</Text>
        </Stack>
      </Center>
    )
  }

  const visibleIds = jobs.map((j) => j.id)
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  const someSelected = visibleIds.some((id) => selectedIds.has(id))

  const tableHead = (
    <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10, boxShadow: '0 1px 0 0 var(--border-subtle)' }}>
      <tr style={{ borderBottom: '1px solid var(--border-divider)' }}>
        <th scope="col" style={{ ...TH_STYLE, width: 40 }}>
          <Checkbox
            aria-label="Select all visible jobs"
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onChange={() => onToggleSelectAll(visibleIds)}
            color="brand"
            size="xs"
          />
        </th>
        <th scope="col" style={TH_STYLE}>Company</th>
        <th scope="col" style={TH_STYLE}>Role</th>
        <th scope="col" style={TH_STYLE}>Source</th>
        <th scope="col" style={TH_STYLE}>Archetype</th>
        <th scope="col" style={TH_STYLE}>Eval</th>
        <th scope="col" style={TH_STYLE}>Resume</th>
        <th scope="col" style={{ ...TH_STYLE, width: 40 }}>
          <span className="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
  )

  const sharedCallbacks = {
    onToggleExpand: handleToggleExpand,
    onToggleSelect,
    onArchive,
    onDelete,
    onUpdateStatus,
  }

  if (shouldVirtualize) {
    const virtualItems = virtualizer.getVirtualItems()
    const paddingTop = virtualItems.length > 0 ? virtualItems[0]!.start : 0
    const paddingBottom =
      virtualItems.length > 0
        ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1]!.end
        : 0

    return (
      <div ref={scrollRef} style={{ overflow: 'auto', flex: 1 }}>
        <table aria-label="Job tracker" style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
          {tableHead}
          <tbody>
            {paddingTop > 0 && (
              <tr aria-hidden="true">
                <td colSpan={COL_SPAN} style={{ height: paddingTop, padding: 0 }} />
              </tr>
            )}
            {virtualItems.map((virtualRow) => {
              const job = jobs[virtualRow.index]!
              return (
                <JobRowGroup
                  key={job.id}
                  job={job}
                  selected={selectedIds.has(job.id)}
                  activeStep={activeEvalSteps.get(job.id) ?? null}
                  isExpanded={false}
                  {...sharedCallbacks}
                />
              )
            })}
            {paddingBottom > 0 && (
              <tr aria-hidden="true">
                <td colSpan={COL_SPAN} style={{ height: paddingBottom, padding: 0 }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div ref={scrollRef} style={{ overflow: 'auto', flex: 1 }}>
      <table role="grid" aria-label="Job tracker" style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
        {tableHead}
        <tbody>
          {jobs.map((job) => (
            <JobRowGroup
              key={job.id}
              job={job}
              selected={selectedIds.has(job.id)}
              activeStep={activeEvalSteps.get(job.id) ?? null}
              isExpanded={expandedJobId === job.id}
              {...sharedCallbacks}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface JobRowGroupProps {
  job: JobWithResumes
  selected: boolean
  activeStep: string | null
  isExpanded: boolean
  onToggleExpand: (id: string) => void
  onToggleSelect: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onUpdateStatus: (jobId: string, status: string) => Promise<void>
}

const JobRowGroup = memo(function JobRowGroup({
  job,
  selected,
  activeStep,
  isExpanded,
  onToggleExpand,
  onToggleSelect,
  onArchive,
  onDelete,
  onUpdateStatus,
}: JobRowGroupProps) {
  const panelId = useId()
  const rowRef = useRef<HTMLTableRowElement>(null)
  const evaluated = job.score !== null && job.status !== 'new'
  const latestResume = job.resumes.length > 0 ? job.resumes[job.resumes.length - 1]! : null
  const resumeDownloadUrl = latestResume ? `/api/resumes/${latestResume.id}` : null
  const resumeFilename = latestResume?.filename ?? null

  const handleRowClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest('input[type="checkbox"]') ||
        target.closest('a') ||
        target.closest('button') ||
        target.closest('select')
      ) return
      onToggleExpand(job.id)
    },
    [job.id, onToggleExpand],
  )

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onToggleExpand(job.id)
      }
    },
    [job.id, onToggleExpand],
  )

  const archetypeStyle = job.archetype
    ? (ARCHETYPE_STYLE[job.archetype] ?? { background: 'var(--surface-sunken)', color: 'var(--text-muted)' })
    : null

  return (
    <>
      <tr
        ref={rowRef}
        tabIndex={0}
        aria-selected={selected}
        aria-expanded={isExpanded}
        aria-controls={isExpanded ? panelId : undefined}
        onClick={handleRowClick}
        onKeyDown={handleRowKeyDown}
        className="job-row"
        data-expanded={isExpanded ? 'true' : undefined}
        data-archived={job.status === 'archived' ? 'true' : undefined}
      >
        <td style={TD_STYLE}>
          <Checkbox
            aria-label={`Select ${job.company} — ${job.role}`}
            checked={selected}
            onChange={() => onToggleSelect(job.id)}
            color="brand"
            size="xs"
          />
        </td>

        <td style={{ ...TD_STYLE, fontWeight: 500, color: 'var(--foreground)', maxWidth: 160 }}>
          <Group gap={6} style={{ overflow: 'hidden' }}>
            <svg
              aria-hidden="true"
              className="expand-chevron"
              data-expanded={isExpanded ? 'true' : undefined}
              style={{ width: 12, height: 12, flexShrink: 0 }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.company}</span>
          </Group>
        </td>

        <td style={{ ...TD_STYLE, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {job.url ? (
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="role-link">
              {job.role}
            </a>
          ) : (
            job.role
          )}
        </td>

        <td style={TD_STYLE}>
          <Badge
            size="xs"
            style={
              job.source === 'scan'
                ? { background: 'rgba(255, 56, 92, 0.1)', color: 'var(--accent)' }
                : { background: 'var(--surface-sunken)', color: 'var(--text-muted)' }
            }
          >
            {job.source}
          </Badge>
        </td>

        <td style={TD_STYLE}>
          {job.archetype ? (
            <Badge size="xs" style={archetypeStyle!}>{job.archetype}</Badge>
          ) : (
            <Text size="xs" c="var(--text-subtle)">—</Text>
          )}
        </td>

        <td style={TD_STYLE}>
          <EvalStatusCell score={job.score} status={job.status} activeStep={activeStep} />
        </td>

        <td style={TD_STYLE}>
          <ResumeCell
            evaluated={evaluated}
            resumeDownloadUrl={resumeDownloadUrl}
            resumeFilename={resumeFilename}
            jobId={job.id}
          />
        </td>

        <td style={TD_STYLE}>
          <ActionMenu job={job} onArchive={onArchive} onDelete={onDelete} />
        </td>
      </tr>

      <ExpandedJobRow
        job={job}
        isExpanded={isExpanded}
        colSpan={COL_SPAN}
        onUpdateStatus={onUpdateStatus}
        onArchive={onArchive}
      />
    </>
  )
})

function ActionMenu({
  job,
  onArchive,
  onDelete,
}: {
  job: JobWithResumes
  onArchive: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon
          type="button"
          variant="subtle"
          color="gray"
          size="sm"
          aria-label={`Actions for ${job.company}`}
        >
          <svg aria-hidden="true" style={{ width: 16, height: 16 }} fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {job.status !== 'archived' && (
          <Menu.Item onClick={() => onArchive(job.id)}>Archive</Menu.Item>
        )}
        <Menu.Item color="red" onClick={() => onDelete(job.id)}>Delete</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
