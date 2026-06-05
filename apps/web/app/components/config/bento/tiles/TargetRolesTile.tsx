'use client'

import { useCallback } from 'react'
import {
  Paper, Group, Text, Stack, SimpleGrid, TextInput, Select, ActionIcon, Button, Center, Loader,
} from '@mantine/core'
import { useProfileField } from '../../../../hooks/useProfileField'
import { SaveIndicator } from '../../SaveIndicator'

type RoleTarget = {
  title: string
  priority: 'primary' | 'backup' | 'stretch'
  seniority: string
  pitchWhen: string
}

type TargetRolesForm = {
  roleTargets: RoleTarget[]
}

function parse(data: Record<string, unknown> | null): TargetRolesForm {
  if (!data) return { roleTargets: [] }
  return {
    roleTargets: Array.isArray(data.roleTargets) ? (data.roleTargets as RoleTarget[]) : [],
  }
}

function serialize(form: TargetRolesForm): Record<string, unknown> {
  return {
    roleTargets: form.roleTargets.length > 0 ? form.roleTargets : null,
  }
}

const PRIORITY_OPTIONS = [
  { value: 'primary', label: 'Primary' },
  { value: 'backup', label: 'Backup' },
  { value: 'stretch', label: 'Stretch' },
]

const EMPTY_ROLE: RoleTarget = { title: '', priority: 'primary', seniority: '', pitchWhen: '' }

export function TargetRolesTile() {
  const { form, handleChange, saveStatus } = useProfileField(parse, serialize)

  const handleRoleField = useCallback(
    (idx: number, field: keyof RoleTarget, val: string) => {
      if (!form) return
      handleChange(
        'roleTargets',
        form.roleTargets.map((r, i) => (i === idx ? { ...r, [field]: val } : r)),
      )
    },
    [form, handleChange],
  )

  const handleRoleRemove = useCallback(
    (idx: number) => {
      if (!form) return
      handleChange('roleTargets', form.roleTargets.filter((_, i) => i !== idx))
    },
    [form, handleChange],
  )

  const handleRoleAdd = useCallback(() => {
    if (!form) return
    handleChange('roleTargets', [...form.roleTargets, { ...EMPTY_ROLE }])
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
        <Stack gap={8}>
          {form.roleTargets.map((r, idx) => (
            <Paper key={idx} withBorder p="sm" pos="relative">
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                pos="absolute"
                top={8}
                right={8}
                onClick={() => handleRoleRemove(idx)}
                aria-label="Remove role"
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </ActionIcon>
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={8} pr={32}>
                <TextInput
                  placeholder="e.g. Staff Engineer"
                  value={r.title}
                  onChange={(e) => handleRoleField(idx, 'title', e.target.value)}
                  aria-label="Role title"
                />
                <TextInput
                  placeholder="e.g. Senior / Staff"
                  value={r.seniority}
                  onChange={(e) => handleRoleField(idx, 'seniority', e.target.value)}
                  aria-label="Seniority"
                />
                <Select
                  data={PRIORITY_OPTIONS}
                  value={r.priority}
                  onChange={(v) => v && handleRoleField(idx, 'priority', v)}
                  aria-label="Priority"
                  allowDeselect={false}
                />
              </SimpleGrid>
            </Paper>
          ))}
          <Button
            variant="subtle"
            size="xs"
            mt={form.roleTargets.length > 0 ? 4 : 0}
            onClick={handleRoleAdd}
          >
            + Add role
          </Button>
        </Stack>
      )}
    </Paper>
  )
}
