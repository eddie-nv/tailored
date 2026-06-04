'use client'

import { useState, useCallback, memo } from 'react'
import { Anchor, Box, Button, Center, Checkbox, Group, Modal, ScrollArea, Text, UnstyledButton } from '@mantine/core'
import type { NewJob } from '@/app/hooks/useScanner'

interface ScanInterruptModalProps {
  jobs: NewJob[]
  onEvaluateSelected: (ids: string[]) => void
  onDismiss: () => void
}

export const ScanInterruptModal = memo(function ScanInterruptModal({
  jobs,
  onEvaluateSelected,
  onDismiss,
}: ScanInterruptModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(jobs.map((j) => j.id)),
  )

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const allSelected = jobs.length > 0 && jobs.every((j) => selectedIds.has(j.id))
  const someSelected = jobs.some((j) => selectedIds.has(j.id))

  const toggleAll = useCallback(() => {
    setSelectedIds(allSelected ? new Set() : new Set(jobs.map((j) => j.id)))
  }, [allSelected, jobs])

  const handleEvaluate = useCallback(() => {
    onEvaluateSelected(Array.from(selectedIds))
  }, [selectedIds, onEvaluateSelected])

  return (
    <Modal
      opened
      onClose={onDismiss}
      title={
        <Box>
          <Text size="sm" fw={600} c="var(--foreground)">
            {jobs.length} new {jobs.length === 1 ? 'job' : 'jobs'} found — select to evaluate
          </Text>
        </Box>
      }
      size="lg"
      centered
      aria-labelledby="scan-modal-title"
    >
      <ScrollArea style={{ maxHeight: '50vh' }}>
        {jobs.length === 0 ? (
          <Center p={48}>
            <Text c="var(--text-faint)" size="sm">No new jobs matched your filters.</Text>
          </Center>
        ) : (
          <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'white', borderBottom: '1px solid var(--border-divider)' }}>
              <tr>
                <th scope="col" style={{ width: 40, padding: '10px 16px', textAlign: 'left' }}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onChange={toggleAll}
                    aria-label="Select all"
                    color="brand"
                    size="xs"
                  />
                </th>
                <th scope="col" style={{ padding: '10px 12px', textAlign: 'left' }}>
                  <Text size="xs" c="var(--text-muted)" fw={500}>Company</Text>
                </th>
                <th scope="col" style={{ padding: '10px 12px', textAlign: 'left' }}>
                  <Text size="xs" c="var(--text-muted)" fw={500}>Role</Text>
                </th>
                <th scope="col" style={{ padding: '10px 12px', textAlign: 'left' }}>
                  <Text size="xs" c="var(--text-muted)" fw={500}>URL</Text>
                </th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} style={{ borderBottom: '1px solid var(--border-divider)' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <Checkbox
                      checked={selectedIds.has(job.id)}
                      onChange={() => toggleRow(job.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${job.role} at ${job.company}`}
                      color="brand"
                      size="xs"
                    />
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Text size="xs" c="var(--text-secondary)" fw={500}>{job.company}</Text>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Text size="xs" c="var(--foreground)">{job.role}</Text>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {job.url ? (
                      <Anchor
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="xs"
                        truncate
                        display="block"
                        maw={200}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {new URL(job.url).hostname}
                      </Anchor>
                    ) : (
                      <Text component="span" c="var(--text-faint)">—</Text>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ScrollArea>
      <Group justify="space-between" pt="md" mt="xs" style={{ borderTop: '1px solid var(--border-divider)' }}>
        <Text size="xs" c="var(--text-muted)">{selectedIds.size} of {jobs.length} selected</Text>
        <Group gap={8}>
          <UnstyledButton onClick={onDismiss} fz="xs" c="var(--text-muted)">Dismiss</UnstyledButton>
          <Button
            size="xs"
            color="brand"
            onClick={handleEvaluate}
            disabled={selectedIds.size === 0}
            leftSection={<span aria-hidden="true">▶</span>}
          >
            Evaluate Selected ({selectedIds.size})
          </Button>
        </Group>
      </Group>
    </Modal>
  )
})
