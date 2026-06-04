'use client'

import { Box, Group, Loader, Paper, Text } from '@mantine/core'
import type { EvalStep } from '@/app/hooks/useEvaluation'

const STEP_LABELS: Record<string, string> = {
  'archetype-detection': 'Detecting role archetype',
  scoring: 'Scoring against rubric',
  'cv-match': 'Matching CV to requirements',
  'compensation-research': 'Researching compensation',
  'report-generation': 'Generating evaluation report',
}

interface EvalProgressPanelProps {
  steps: EvalStep[]
  streamedText: string
  status: 'creating-job' | 'evaluating' | 'done' | 'error'
  error: string | null
}

export function EvalProgressPanel({ steps, streamedText, status, error }: EvalProgressPanelProps) {
  return (
    <Paper
      role="status"
      aria-live="polite"
      aria-label="Evaluation progress"
      withBorder
      radius={8}
      bg="white"
      shadow="xs"
      style={{ overflow: 'hidden', margin: '0 12px 12px' }}
    >
      {status === 'creating-job' && (
        <Group p="12px 16px" c="var(--text-muted)" gap={8}>
          <Loader size={14} />
          <Text size="sm">Creating job record…</Text>
        </Group>
      )}

      {(status === 'evaluating' || status === 'done') && (
        <div>
          {steps.map((step) => (
            <Group
              key={step.name}
              gap={12}
              p="10px 16px"
              style={{ borderBottom: '1px solid var(--border-divider)' }}
            >
              <StepIcon status={step.status} />
              <Text
                size="sm"
                c={
                  step.status === 'active'
                    ? 'var(--foreground)'
                    : step.status === 'done'
                      ? 'var(--text-muted)'
                      : 'var(--text-subtle)'
                }
                fw={step.status === 'active' ? 500 : 400}
              >
                {STEP_LABELS[step.name] ?? step.name}
              </Text>
              {step.status === 'active' && <Loader size={14} color="var(--accent)" ml="auto" />}
              {step.status === 'done' && (
                <Text component="span" size="xs" c="#10b981" ml="auto">Done</Text>
              )}
            </Group>
          ))}
        </div>
      )}

      {streamedText && (
        <Box p="12px 16px" style={{ borderTop: '1px solid var(--border-divider)' }}>
          <Text size="xs" c="var(--text-faint)" fw={500} tt="uppercase" lts="0.05em" mb={6}>
            Evaluation Report
          </Text>
          <Text size="xs" c="var(--text-secondary)" lh={1.6} style={{ maxHeight: 160, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
            {streamedText}
          </Text>
        </Box>
      )}

      {status === 'error' && error && (
        <Group p="12px 16px" c="#dc2626" align="flex-start" gap={8}>
          <span style={{ flexShrink: 0 }}>✕</span>
          <Text size="sm">{error}</Text>
        </Group>
      )}
    </Paper>
  )
}

function StepIcon({ status }: { status: EvalStep['status'] }) {
  if (status === 'done') {
    return (
      <svg aria-hidden="true" style={{ width: 16, height: 16, color: '#10b981', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  if (status === 'active') {
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
  return (
    <Box
      component="span"
      aria-hidden="true"
      display="inline-block"
      w={16}
      h={16}
      bd="2px solid var(--border-subtle)"
      style={{ borderRadius: '50%', flexShrink: 0 }}
    />
  )
}
