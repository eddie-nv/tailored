'use client'

import { memo } from 'react'
import { Flex, Loader, Text } from '@mantine/core'
import { scoreStyle } from '@/app/lib/scoreStyles'

interface EvalStatusCellProps {
  score: string | null
  status: string
  activeStep: string | null
}

export const EvalStatusCell = memo(function EvalStatusCell({
  score,
  status,
  activeStep,
}: EvalStatusCellProps) {
  if (activeStep) {
    return (
      <Flex component="span" align="center" gap={6} fz="xs" c="var(--accent)">
        <Loader size={12} color="var(--accent)" />
        <Text component="span" truncate maw={100}>
          {stepLabel(activeStep)}
        </Text>
      </Flex>
    )
  }

  if (score) {
    return (
      <span aria-label={`Match score: ${score} (A is best, F is worst)`} style={scoreStyle(score)}>
        {score}
      </span>
    )
  }

  if (status === 'new') {
    return <Text component="span" size="xs" c="var(--text-subtle)">New</Text>
  }

  return (
    <Text component="span" size="xs" c="var(--text-faint)" tt="capitalize">
      {status}
    </Text>
  )
})

const STEP_LABELS: Record<string, string> = {
  'archetype-detection': 'Detecting…',
  scoring: 'Scoring…',
  'cv-match': 'CV match…',
  'compensation-research': 'Comp…',
  'report-generation': 'Report…',
}

function stepLabel(step: string): string {
  return STEP_LABELS[step] ?? step
}
