'use client'

import { Button, Checkbox, Group, Loader } from '@mantine/core'

type BatchProgress = {
  completed: number
  total: number
}

type ResultsToolbarProps = {
  selectedCount: number
  showArchived: boolean
  onToggleArchived: (v: boolean) => void
  onFocusPaste: () => void
  onScan: () => void
  isScanRunning: boolean
  onEvaluateSelected: () => void
  isBatchRunning: boolean
  batchProgress?: BatchProgress
}

export function ResultsToolbar({
  selectedCount,
  showArchived,
  onToggleArchived,
  onFocusPaste,
  onScan,
  isScanRunning,
  onEvaluateSelected,
  isBatchRunning,
  batchProgress,
}: ResultsToolbarProps) {
  const evalLabel = isBatchRunning
    ? `Evaluating ${batchProgress?.completed ?? 0} of ${batchProgress?.total ?? 0}…`
    : selectedCount > 0
      ? `Evaluate Selected (${selectedCount})`
      : 'Evaluate Selected'

  const isEvalDisabled = isBatchRunning || selectedCount === 0

  const evalTitle = isBatchRunning
    ? 'Batch evaluation in progress'
    : selectedCount === 0
      ? 'Select rows to evaluate'
      : `Evaluate ${selectedCount} selected job${selectedCount === 1 ? '' : 's'}`

  return (
    <Group gap={8} p="8px 12px" style={{ borderBottom: '1px solid var(--border-divider)', flexShrink: 0 }}>
      <Button size="xs" color="brand" onClick={onFocusPaste} leftSection={<span aria-hidden="true">+</span>}>
        Paste URL
      </Button>

      <Button
        size="xs"
        color="dark"
        onClick={onScan}
        disabled={isScanRunning}
        title={isScanRunning ? 'Scan in progress…' : 'Scan configured portals for new jobs'}
        leftSection={
          isScanRunning ? (
            <Loader size={12} />
          ) : (
            <span aria-hidden="true">🔍</span>
          )
        }
      >
        {isScanRunning ? 'Scanning…' : 'Scan'}
      </Button>

      <Button
        size="xs"
        color="brand"
        variant="filled"
        disabled={isEvalDisabled}
        title={evalTitle}
        onClick={isEvalDisabled ? undefined : onEvaluateSelected}
        leftSection={
          isBatchRunning ? (
            <Loader size={12} />
          ) : (
            <span aria-hidden="true">▶</span>
          )
        }
      >
        {evalLabel}
      </Button>

      <Button size="xs" variant="default" disabled={selectedCount === 0} title="Resume generation coming in M9" leftSection={<span aria-hidden="true">📄</span>}>
        Generate Resume
      </Button>

      <Group ml="auto" gap={8}>
        <Checkbox
          label="Show archived"
          checked={showArchived}
          onChange={(e) => onToggleArchived(e.currentTarget.checked)}
          color="brand"
          size="xs"
        />
      </Group>
    </Group>
  )
}
