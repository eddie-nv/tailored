'use client'

import { useCallback, useEffect } from 'react'
import {
  Paper, Group, Text, Stack, TextInput, Select, ActionIcon, Button,
  Center, Loader,
} from '@mantine/core'
import { useProfileField } from '../../../../hooks/useProfileField'
import { useRoleDerivedTitles } from '../../../../providers/RoleTargetsProvider'
import { computeDerivedTitles, serializeRoleTargets } from '../../../../lib/roleTargets'
import type { RoleTarget } from '../../../../lib/roleTargets'
import { SaveIndicator } from '../../SaveIndicator'

type TargetRolesForm = { roleTargets: RoleTarget[] }

function parse(data: Record<string, unknown> | null): TargetRolesForm {
  if (!data) return { roleTargets: [] }
  return {
    roleTargets: Array.isArray(data.roleTargets) ? (data.roleTargets as RoleTarget[]) : [],
  }
}

function serialize(form: TargetRolesForm): Record<string, unknown> {
  return { roleTargets: serializeRoleTargets(form.roleTargets) }
}

const PRIORITY_ORDER: Record<RoleTarget['priority'], number> = {
  primary: 0,
  backup: 1,
  stretch: 2,
}

const PRIORITY_BG: Record<RoleTarget['priority'], string> = {
  primary: '#3b82f6',
  backup: '#e4e4e7',
  stretch: '#d1fae5',
}

const PRIORITY_FG: Record<RoleTarget['priority'], string> = {
  primary: '#ffffff',
  backup: '#52525b',
  stretch: '#065f46',
}

const PRIORITY_OPTIONS = [
  { value: 'primary', label: 'Primary' },
  { value: 'backup', label: 'Backup' },
  { value: 'stretch', label: 'Stretch' },
]

const EMPTY_ROLE: RoleTarget = { title: '', priority: 'primary', seniority: '' }

const TrashIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const colLabelStyle = {
  fontSize: '0.6875rem',
  fontWeight: 500 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: '#a1a1aa',
}

export function TargetRolesTile() {
  const { form, handleChange, saveStatus } = useProfileField(parse, serialize)
  const { setDerivedTitles } = useRoleDerivedTitles()

  useEffect(() => {
    setDerivedTitles(computeDerivedTitles(form?.roleTargets ?? []))
  }, [form?.roleTargets, setDerivedTitles])

  const handleRoleField = useCallback(
    (originalIdx: number, field: keyof RoleTarget, val: string) => {
      if (!form) return
      handleChange(
        'roleTargets',
        form.roleTargets.map((r, i) => (i === originalIdx ? { ...r, [field]: val } : r)),
      )
    },
    [form, handleChange],
  )

  const handleRoleRemove = useCallback(
    (originalIdx: number) => {
      if (!form) return
      handleChange('roleTargets', form.roleTargets.filter((_, i) => i !== originalIdx))
    },
    [form, handleChange],
  )

  const handleRoleAdd = useCallback(() => {
    if (!form) return
    handleChange('roleTargets', [...form.roleTargets, { ...EMPTY_ROLE }])
  }, [form, handleChange])

  const sorted = form
    ? [...form.roleTargets]
        .map((r, originalIdx) => ({ ...r, originalIdx }))
        .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    : []

  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 12' }} className="bento-tile">
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
      ) : sorted.length === 0 ? (
        <Center py="xl">
          <Text size="sm" c="dimmed" style={{ cursor: 'pointer' }} onClick={handleRoleAdd}>
            + Add your first target role
          </Text>
        </Center>
      ) : (
        <Stack gap={8}>
          <Group gap={8} wrap="nowrap" px="sm" pb={2}>
            <Text style={{ ...colLabelStyle, flex: 2 }}>Role</Text>
            <Text style={{ ...colLabelStyle, flex: 1 }}>Level</Text>
            <Text style={{ ...colLabelStyle, width: 95, flexShrink: 0 }}>Priority</Text>
            <div style={{ width: 26, flexShrink: 0 }} />
          </Group>

          {sorted.map(({ originalIdx, ...role }) => (
            <Paper
              key={originalIdx}
              withBorder
              p="sm"
            >
              <Group gap={8} wrap="nowrap" align="center">
                <TextInput
                  placeholder="e.g. Staff Engineer"
                  value={role.title}
                  onChange={(e) => handleRoleField(originalIdx, 'title', e.target.value)}
                  aria-label="Role title"
                  style={{ flex: 2 }}
                  styles={{ input: { fontSize: '0.875rem' } }}
                />
                <TextInput
                  placeholder="e.g. Senior / Staff"
                  value={role.seniority}
                  onChange={(e) => handleRoleField(originalIdx, 'seniority', e.target.value)}
                  aria-label="Level"
                  style={{ flex: 1 }}
                  styles={{ input: { fontSize: '0.875rem' } }}
                />
                <Select
                  data={PRIORITY_OPTIONS}
                  value={role.priority}
                  onChange={(v) => v && handleRoleField(originalIdx, 'priority', v as RoleTarget['priority'])}
                  aria-label="Priority"
                  allowDeselect={false}
                  variant="unstyled"
                  style={{ width: 95, flexShrink: 0 }}
                  styles={{
                    input: {
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: PRIORITY_BG[role.priority],
                      color: PRIORITY_FG[role.priority],
                      borderRadius: '999px',
                      cursor: 'pointer',
                      paddingLeft: 10,
                      paddingRight: 28,
                      height: 30,
                      minHeight: 30,
                    },
                    section: { color: PRIORITY_FG[role.priority] },
                  }}
                />
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={() => handleRoleRemove(originalIdx)}
                  aria-label="Remove role"
                  style={{ flexShrink: 0 }}
                >
                  <TrashIcon />
                </ActionIcon>
              </Group>
            </Paper>
          ))}

          <Button
            variant="subtle"
            size="xs"
            mt={4}
            onClick={handleRoleAdd}
            style={{ alignSelf: 'flex-start' }}
          >
            + Add role
          </Button>
        </Stack>
      )}
    </Paper>
  )
}
