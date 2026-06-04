'use client'

import { useCallback } from 'react'
import { Checkbox, Stack, Box, Group, SimpleGrid, Text } from '@mantine/core'
import { PORTAL_GROUPS } from './portals'

type Props = {
  value: string[]
  onChange: (portals: string[]) => void
}

export function PresetPortals({ value, onChange }: Props) {
  const selectedSet = new Set(value)

  const toggle = useCallback(
    (key: string) => {
      const next = new Set(selectedSet)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      onChange([...next])
    },
    [selectedSet, onChange],
  )

  const toggleGroup = useCallback(
    (keys: string[]) => {
      const allSelected = keys.every((k) => selectedSet.has(k))
      const next = new Set(selectedSet)
      if (allSelected) {
        keys.forEach((k) => next.delete(k))
      } else {
        keys.forEach((k) => next.add(k))
      }
      onChange([...next])
    },
    [selectedSet, onChange],
  )

  return (
    <Stack gap={20}>
      {PORTAL_GROUPS.map((group) => {
        const groupKeys = group.portals.map((p) => p.key)
        const allSelected = groupKeys.every((k) => selectedSet.has(k))
        const someSelected = !allSelected && groupKeys.some((k) => selectedSet.has(k))

        return (
          <Box key={group.name}>
            <Group gap={8} mb={8}>
              <Checkbox
                id={`group-${group.name}`}
                checked={allSelected}
                indeterminate={someSelected}
                onChange={() => toggleGroup(groupKeys)}
                color="brand"
                size="xs"
                label={<Text size="xs" fw={600} tt="uppercase" lts="0.1em" c="#71717a">{group.name}</Text>}
              />
            </Group>
            <SimpleGrid cols={2} spacing={16} verticalSpacing={6} pl={20}>
              {group.portals.map((portal) => (
                <Checkbox
                  key={portal.key}
                  checked={selectedSet.has(portal.key)}
                  onChange={() => toggle(portal.key)}
                  color="brand"
                  size="xs"
                  label={portal.label}
                  styles={{ label: { fontSize: '0.875rem', color: '#3f3f46', cursor: 'pointer' } }}
                />
              ))}
            </SimpleGrid>
          </Box>
        )
      })}
    </Stack>
  )
}
