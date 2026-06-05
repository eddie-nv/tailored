'use client'

import { useCallback } from 'react'
import {
  Paper, Group, Text, Stack, SimpleGrid, TextInput, Select, ActionIcon, Button, Center, Loader,
} from '@mantine/core'
import { useProfileField } from '../../../../hooks/useProfileField'
import { SaveIndicator } from '../../SaveIndicator'
import { TagInput } from '../../TagInput'

type Archetype = { name: string; level: string; fit: 'primary' | 'secondary' | 'adjacent' }

type TargetRolesForm = {
  targetRoles: string[]
  archetypes: Archetype[]
}

function parse(data: Record<string, unknown> | null): TargetRolesForm {
  if (!data) return { targetRoles: [], archetypes: [] }
  return {
    targetRoles: Array.isArray(data.targetRoles) ? (data.targetRoles as string[]) : [],
    archetypes: Array.isArray(data.archetypes) ? (data.archetypes as Archetype[]) : [],
  }
}

function serialize(form: TargetRolesForm): Record<string, unknown> {
  return {
    targetRoles: form.targetRoles,
    archetypes: form.archetypes.length > 0 ? form.archetypes : null,
  }
}

const labelStyle = {
  fontSize: '0.6875rem',
  fontWeight: 500 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: '#a1a1aa',
  marginBottom: 8,
}

const FIT_OPTIONS = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'adjacent', label: 'Adjacent' },
]

const EMPTY_ARCHETYPE: Archetype = { name: '', level: '', fit: 'secondary' }

export function TargetRolesTile() {
  const { form, handleChange, saveStatus } = useProfileField(parse, serialize)

  const handleArchetypeField = useCallback(
    (idx: number, field: keyof Archetype, val: string) => {
      if (!form) return
      handleChange(
        'archetypes',
        form.archetypes.map((a, i) => (i === idx ? { ...a, [field]: val } : a)),
      )
    },
    [form, handleChange],
  )

  const handleArchetypeRemove = useCallback(
    (idx: number) => {
      if (!form) return
      handleChange('archetypes', form.archetypes.filter((_, i) => i !== idx))
    },
    [form, handleChange],
  )

  const handleArchetypeAdd = useCallback(() => {
    if (!form) return
    handleChange('archetypes', [...form.archetypes, { ...EMPTY_ARCHETYPE }])
  }, [form, handleChange])

  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 5' }} className="bento-tile">
      <Group justify="space-between" mb="md">
        <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed">
          Target Roles
        </Text>
        <SaveIndicator status={saveStatus} />
      </Group>

      {!form ? (
        <Center h={120}>
          <Loader size="sm" color="var(--text-faint)" />
        </Center>
      ) : (
        <Stack gap={20}>
          <TagInput
            label="Role Titles"
            value={form.targetRoles}
            onChange={(v) => handleChange('targetRoles', v)}
            placeholder="e.g. Staff Engineer, Engineering Manager"
          />

          <div>
            <Text style={labelStyle} mb={8}>Archetypes</Text>
            <Stack gap={8}>
              {form.archetypes.map((a, idx) => (
                <Paper key={idx} withBorder p="sm" pos="relative">
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    pos="absolute"
                    top={8}
                    right={8}
                    onClick={() => handleArchetypeRemove(idx)}
                    aria-label="Remove archetype"
                  >
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </ActionIcon>
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={8} pr={32}>
                    <TextInput
                      placeholder="e.g. Engineering Manager"
                      value={a.name}
                      onChange={(e) => handleArchetypeField(idx, 'name', e.target.value)}
                      aria-label="Archetype name"
                    />
                    <TextInput
                      placeholder="Senior"
                      value={a.level}
                      onChange={(e) => handleArchetypeField(idx, 'level', e.target.value)}
                      aria-label="Archetype level"
                    />
                    <Select
                      data={FIT_OPTIONS}
                      value={a.fit}
                      onChange={(v) => v && handleArchetypeField(idx, 'fit', v)}
                      aria-label="Archetype fit"
                      allowDeselect={false}
                    />
                  </SimpleGrid>
                </Paper>
              ))}
            </Stack>
            <Button
              variant="subtle"
              size="xs"
              mt={form.archetypes.length > 0 ? 8 : 0}
              onClick={handleArchetypeAdd}
            >
              + Add archetype
            </Button>
          </div>
        </Stack>
      )}
    </Paper>
  )
}
