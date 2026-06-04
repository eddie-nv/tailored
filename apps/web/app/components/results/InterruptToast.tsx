'use client'

import { Box, Group, Paper, Text, UnstyledButton } from '@mantine/core'
import type { InterruptData } from '@/app/hooks/useEvaluation'
import { scoreStyle } from '@/app/lib/scoreStyles'

interface InterruptToastProps {
  interrupt: InterruptData
  onConfirm: () => void
  onDismiss: () => void
}

export function InterruptToast({ interrupt, onConfirm, onDismiss }: InterruptToastProps) {
  const { score, archetype, cvMatchPct } = interrupt.metadata

  return (
    <Paper
      role="alert"
      aria-labelledby="interrupt-title"
      aria-describedby="interrupt-desc"
      withBorder
      radius={8}
      bg="white"
      shadow="xs"
      style={{ margin: '0 12px 12px', overflow: 'hidden' }}
    >
      <Group align="flex-start" gap={12} p="12px 16px">
        <Text component="span" fz="lg" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>✓</Text>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text component="p" id="interrupt-title" size="sm" fw={600} c="var(--foreground)" style={{ margin: 0 }}>
            Evaluation complete
          </Text>
          <Text component="p" id="interrupt-desc" size="xs" c="var(--text-muted)" style={{ margin: '2px 0 0' }}>
            {interrupt.message}
          </Text>
          <Group gap={8} mt={8} style={{ flexWrap: 'wrap' }}>
            <span aria-label={`Score: ${score}`} style={scoreStyle(score)}>{score}</span>
            <Text component="span" size="xs" c="var(--text-faint)">
              {archetype} · {cvMatchPct}% CV match
            </Text>
          </Group>
        </Box>
      </Group>

      <Group gap={0} style={{ borderTop: '1px solid var(--border-divider)' }}>
        <UnstyledButton
          onClick={onDismiss}
          fz="xs"
          c="var(--text-muted)"
          style={{ flex: 1, padding: '8px 0', borderRight: '1px solid var(--border-divider)', textAlign: 'center' }}
          className="interrupt-dismiss-btn"
        >
          Dismiss
        </UnstyledButton>
        <UnstyledButton
          onClick={onConfirm}
          fz="xs"
          fw={500}
          c="var(--accent)"
          style={{ flex: 1, padding: '8px 0', textAlign: 'center' }}
          className="interrupt-confirm-btn"
        >
          Add to tracker
        </UnstyledButton>
      </Group>
    </Paper>
  )
}
