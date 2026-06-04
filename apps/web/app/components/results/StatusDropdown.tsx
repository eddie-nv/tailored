'use client'

import { memo, useState, useCallback, useId, type CSSProperties } from 'react'
import { Box, Group, Loader, Text } from '@mantine/core'

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'applying', label: 'Applying' },
  { value: 'applied', label: 'Applied' },
  { value: 'archived', label: 'Archived' },
] as const

type JobStatus = (typeof STATUS_OPTIONS)[number]['value']

const STATUS_STYLES: Record<string, CSSProperties> = {
  new:      { color: 'var(--text-muted)', background: 'var(--surface-sunken)', borderColor: 'var(--border-subtle)' },
  reviewed: { color: '#2563eb', background: '#eff6ff', borderColor: '#bfdbfe' },
  applying: { color: '#d97706', background: '#fffbeb', borderColor: '#fde68a' },
  applied:  { color: '#059669', background: '#ecfdf5', borderColor: '#a7f3d0' },
  archived: { color: 'var(--text-faint)', background: 'var(--surface)', borderColor: 'var(--border-subtle)' },
}

interface StatusDropdownProps {
  jobId: string
  status: string
  onUpdate: (jobId: string, status: string) => Promise<void>
}

export const StatusDropdown = memo(function StatusDropdown({
  jobId,
  status,
  onUpdate,
}: StatusDropdownProps) {
  const selectId = useId()
  const [isSaving, setIsSaving] = useState(false)
  const [localStatus, setLocalStatus] = useState(status)

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value as JobStatus
      const prevStatus = localStatus
      setLocalStatus(newStatus)
      setIsSaving(true)
      try {
        await onUpdate(jobId, newStatus)
      } catch {
        setLocalStatus(prevStatus)
      } finally {
        setIsSaving(false)
      }
    },
    [jobId, localStatus, onUpdate],
  )

  const statusStyle = STATUS_STYLES[localStatus] ?? STATUS_STYLES['new']!

  return (
    <Group gap={8}>
      <Text component="label" htmlFor={selectId} size="xs" c="var(--text-faint)" fw={500} style={{ flexShrink: 0 }}>
        Status
      </Text>
      <Box pos="relative">
        <select
          id={selectId}
          value={localStatus}
          onChange={handleChange}
          disabled={isSaving}
          className="status-select"
          style={statusStyle}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ background: 'white', color: 'var(--foreground)' }}>
              {opt.label}
            </option>
          ))}
        </select>
        <div aria-hidden="true" style={{ pointerEvents: 'none', position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }}>
          {isSaving ? (
            <Loader size={12} style={{ opacity: 0.6 }} />
          ) : (
            <svg style={{ width: 12, height: 12, opacity: 0.5, color: 'currentColor' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </Box>
    </Group>
  )
})
