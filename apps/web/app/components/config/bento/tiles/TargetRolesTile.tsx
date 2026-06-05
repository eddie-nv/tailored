'use client'

import { useState, useCallback } from 'react'
import {
  Paper, Group, Text, Stack, TextInput, Select, ActionIcon, Button,
  Center, Loader, Collapse, Textarea,
} from '@mantine/core'
import { useProfileField } from '../../../../hooks/useProfileField'
import { SaveIndicator } from '../../SaveIndicator'

type RoleTarget = {
  title: string
  priority: 'primary' | 'backup' | 'stretch'
  seniority: string
  pitchWhen: string
}

type TargetRolesForm = { roleTargets: RoleTarget[] }

function parse(data: Record<string, unknown> | null): TargetRolesForm {
  if (!data) return { roleTargets: [] }
  return {
    roleTargets: Array.isArray(data.roleTargets) ? (data.roleTargets as RoleTarget[]) : [],
  }
}

function serialize(form: TargetRolesForm): Record<string, unknown> {
  return { roleTargets: form.roleTargets.length > 0 ? form.roleTargets : null }
}

const PRIORITY_ORDER: Record<RoleTarget['priority'], number> = {
  primary: 0,
  backup: 1,
  stretch: 2,
}

const PRIORITY_DOT: Record<RoleTarget['priority'], string> = {
  primary: '#3b82f6',
  backup: '#71717a',
  stretch: '#a1a1aa',
}

const PRIORITY_OPTIONS = [
  { value: 'primary', label: 'Primary' },
  { value: 'backup', label: 'Backup' },
  { value: 'stretch', label: 'Stretch' },
]

const EMPTY_ROLE: RoleTarget = { title: '', priority: 'primary', seniority: '', pitchWhen: '' }

const TrashIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width={13}
    height={13}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    aria-hidden="true"
    style={{ transition: 'transform 180ms ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const labelStyle = {
  fontSize: '0.6875rem',
  fontWeight: 500 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: '#a1a1aa',
}

export function TargetRolesTile() {
  const { form, handleChange, saveStatus } = useProfileField(parse, serialize)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const toggleExpand = useCallback((originalIdx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(originalIdx)) next.delete(originalIdx)
      else next.add(originalIdx)
      return next
    })
  }, [])

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
      setExpanded((prev) => {
        const next = new Set(prev)
        next.delete(originalIdx)
        return next
      })
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
      ) : sorted.length === 0 ? (
        <Center py="xl">
          <Text size="sm" c="dimmed" style={{ cursor: 'pointer' }} onClick={handleRoleAdd}>
            + Add your first target role
          </Text>
        </Center>
      ) : (
        <Stack gap={8}>
          {sorted.map(({ originalIdx, ...role }) => {
            const isOpen = expanded.has(originalIdx)
            const dotColor = PRIORITY_DOT[role.priority]

            return (
              <Paper
                key={originalIdx}
                withBorder
                p="sm"
                style={{
                  borderLeft: `3px solid ${dotColor}`,
                  transition: 'border-color 200ms ease',
                }}
              >
                <Stack gap={8}>
                  <Group gap={8} wrap="nowrap" align="flex-start">
                    <TextInput
                      placeholder="e.g. Staff Engineer"
                      value={role.title}
                      onChange={(e) => handleRoleField(originalIdx, 'title', e.target.value)}
                      aria-label="Role title"
                      style={{ flex: 2 }}
                      styles={{ input: { fontSize: '0.875rem' } }}
                    />
                    <TextInput
                      placeholder="Senior / Staff"
                      value={role.seniority}
                      onChange={(e) => handleRoleField(originalIdx, 'seniority', e.target.value)}
                      aria-label="Seniority"
                      style={{ flex: 1 }}
                      styles={{ input: { fontSize: '0.875rem' } }}
                    />
                    <Select
                      data={PRIORITY_OPTIONS}
                      value={role.priority}
                      onChange={(v) => v && handleRoleField(originalIdx, 'priority', v as RoleTarget['priority'])}
                      aria-label="Priority"
                      allowDeselect={false}
                      style={{ width: 100, flexShrink: 0 }}
                      styles={{
                        input: {
                          fontSize: '0.8125rem',
                          color: dotColor,
                          fontWeight: 500,
                          borderColor: `${dotColor}40`,
                        },
                      }}
                    />
                    <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={() => toggleExpand(originalIdx)}
                        aria-label={isOpen ? 'Hide pitch guidance' : 'Add pitch guidance'}
                        aria-expanded={isOpen}
                      >
                        <ChevronIcon open={isOpen} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => handleRoleRemove(originalIdx)}
                        aria-label="Remove role"
                      >
                        <TrashIcon />
                      </ActionIcon>
                    </Group>
                  </Group>

                  <Collapse expanded={isOpen}>
                    <Stack gap={4} pt={4}>
                      <Text style={labelStyle}>Lead with this role when the JD emphasizes…</Text>
                      <Textarea
                        placeholder="e.g. production AI agents, LangGraph orchestration, reliability at scale"
                        value={role.pitchWhen}
                        onChange={(e) => handleRoleField(originalIdx, 'pitchWhen', e.target.value)}
                        autosize
                        minRows={2}
                        maxRows={4}
                        styles={{
                          input: {
                            fontSize: '0.8125rem',
                            color: 'var(--mantine-color-dimmed)',
                          },
                        }}
                      />
                    </Stack>
                  </Collapse>
                </Stack>
              </Paper>
            )
          })}

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
