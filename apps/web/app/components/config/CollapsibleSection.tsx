'use client'

import { useState, useId } from 'react'
import type { ReactNode } from 'react'
import { Collapse, Group, Box, Text } from '@mantine/core'
import { SaveIndicator } from './SaveIndicator'
import type { SaveStatus } from './SaveIndicator'

type Props = {
  title: string
  saveStatus?: SaveStatus
  defaultOpen?: boolean
  children: ReactNode
}

export function CollapsibleSection({
  title,
  saveStatus = 'idle',
  defaultOpen = true,
  children,
}: Props) {
  const panelId = useId()
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="collapsible-trigger"
      >
        <Text component="span" size="sm" fw={600} c="#18181b" lts="-0.01em">
          {title}
        </Text>
        <Group gap={12}>
          <SaveIndicator status={saveStatus} />
          <svg
            className="collapsible-chevron"
            data-open={isOpen ? 'true' : undefined}
            style={{ width: 16, height: 16, color: '#a1a1aa' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </Group>
      </button>
      <Collapse id={panelId} expanded={isOpen}>
        <Box pt={4} px={24} pb={24}>{children}</Box>
      </Collapse>
    </section>
  )
}
