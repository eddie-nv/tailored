'use client'

import { memo } from 'react'
import { Box, Group, Loader, Paper, Progress, Text } from '@mantine/core'
import type { PlatformEntry, ScanStatus } from '@/app/hooks/useScanner'

interface ScanProgressPanelProps {
  total: number
  done: number
  found: number
  platforms: PlatformEntry[]
  status: Extract<ScanStatus, 'scanning' | 'done' | 'error'>
  error: string | null
}

export const ScanProgressPanel = memo(function ScanProgressPanel({
  total,
  done,
  found,
  platforms,
  status,
  error,
}: ScanProgressPanelProps) {
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <Paper
      role="status"
      aria-live="polite"
      aria-label="Portal scan progress"
      withBorder
      radius={8}
      bg="white"
      shadow="xs"
      style={{ overflow: 'hidden', margin: '0 12px 12px' }}
    >
      <Box p="12px 16px 8px">
        <Group justify="space-between" mb={8}>
          <Text size="xs" fw={500} tt="uppercase" lts="0.05em" c="var(--foreground)">
            {status === 'done' ? 'Scan complete' : 'Scanning portals…'}
          </Text>
          <Text component="span" size="xs" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
            <Text component="span" c="var(--accent)">{found}</Text>
            <Text component="span" c="var(--text-faint)"> new {found === 1 ? 'job' : 'jobs'} found</Text>
          </Text>
        </Group>

        <Progress
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={total || 1}
          aria-label={`${done} of ${total} portals scanned`}
          value={progress}
          color="var(--accent)"
          size={6}
          radius="sm"
          bg="var(--surface-disabled)"
        />

        <Text size="xs" c="var(--text-faint)" mt={6} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {done} / {total} portals
        </Text>
      </Box>

      {platforms.length > 0 && (
        <Box style={{ borderTop: '1px solid var(--border-divider)' }}>
          {platforms.map((p) => (
            <Group
              key={p.name}
              gap={12}
              p="8px 16px"
              style={{ borderBottom: '1px solid var(--border-divider)' }}
            >
              <PlatformIcon done={p.done} />
              <Text size="xs" c={p.done ? 'var(--text-muted)' : 'var(--foreground)'} fw={p.done ? 400 : 500}>
                {p.name}
              </Text>
              {!p.done && status === 'scanning' && <Loader size={14} color="var(--accent)" ml="auto" />}
              {p.done && <Text component="span" size="xs" c="#10b981" ml="auto">Done</Text>}
            </Group>
          ))}
        </Box>
      )}

      {status === 'error' && error && (
        <Group p="12px 16px" style={{ borderTop: '1px solid var(--border-divider)', color: '#dc2626' }} align="flex-start" gap={8}>
          <span style={{ flexShrink: 0, fontSize: '0.75rem' }}>✕</span>
          <Text size="xs">{error}</Text>
        </Group>
      )}
    </Paper>
  )
})

function PlatformIcon({ done }: { done: boolean }) {
  if (done) {
    return (
      <svg aria-hidden="true" style={{ width: 16, height: 16, color: '#10b981', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  return (
    <Box
      component="span"
      aria-hidden="true"
      display="inline-block"
      w={16}
      h={16}
      bd="2px solid var(--accent)"
      style={{ borderRadius: '50%', flexShrink: 0 }}
    />
  )
}
