import { Text } from '@mantine/core'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type Props = { status: SaveStatus }

export function SaveIndicator({ status }: Props) {
  if (status === 'idle') return null

  const label =
    status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Error saving'

  const color =
    status === 'saving'
      ? 'var(--text-faint)'
      : status === 'saved'
        ? '#059669'
        : '#ef4444'

  return (
    <Text component="span" role="status" aria-live="polite" fz={11} fw={500} c={color} data-testid="save-indicator">
      {label}
    </Text>
  )
}
