'use client'

import { useCallback } from 'react'
import {
  Paper, Group, Text, Stack, SimpleGrid, TextInput, ActionIcon, Button, Center, Loader,
} from '@mantine/core'
import { Trash } from '@phosphor-icons/react'
import { useProfileField } from '../../../../hooks/useProfileField'
import { SaveIndicator } from '../../SaveIndicator'

type ProofPoint = { name: string; url: string; heroMetric: string }

type ProofPointsForm = {
  proofPoints: ProofPoint[]
}

function parse(data: Record<string, unknown> | null): ProofPointsForm {
  if (!data) return { proofPoints: [] }
  return {
    proofPoints: Array.isArray(data.proofPoints) ? (data.proofPoints as ProofPoint[]) : [],
  }
}

function serialize(form: ProofPointsForm): Record<string, unknown> {
  return {
    proofPoints: form.proofPoints.length > 0 ? form.proofPoints : null,
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

const EMPTY_PROOF_POINT: ProofPoint = { name: '', url: '', heroMetric: '' }

export function ProofPointsTile() {
  const { form, handleChange, saveStatus } = useProfileField(parse, serialize)

  const handleProofField = useCallback(
    (idx: number, field: keyof ProofPoint, val: string) => {
      if (!form) return
      handleChange(
        'proofPoints',
        form.proofPoints.map((p, i) => (i === idx ? { ...p, [field]: val } : p)),
      )
    },
    [form, handleChange],
  )

  const handleProofRemove = useCallback(
    (idx: number) => {
      if (!form) return
      handleChange('proofPoints', form.proofPoints.filter((_, i) => i !== idx))
    },
    [form, handleChange],
  )

  const handleProofAdd = useCallback(() => {
    if (!form) return
    handleChange('proofPoints', [...form.proofPoints, { ...EMPTY_PROOF_POINT }])
  }, [form, handleChange])

  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 12' }} className="bento-tile">
      <Group justify="space-between" mb="md">
        <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed">
          Proof Points
        </Text>
        <SaveIndicator status={saveStatus} />
      </Group>

      {!form ? (
        <Center h={120}>
          <Loader size="sm" color="var(--text-faint)" />
        </Center>
      ) : (
        <Stack gap={12}>
          {form.proofPoints.length === 0 ? (
            <Center py="xl">
              <Text
                size="sm"
                c="dimmed"
                style={{ cursor: 'pointer' }}
                onClick={handleProofAdd}
              >
                + Add your first proof point
              </Text>
            </Center>
          ) : (
            <>
              <SimpleGrid cols={3} spacing={4} style={{ fontSize: '0.6875rem' }}>
                <Text style={labelStyle}>Project / Achievement</Text>
                <Text style={labelStyle}>URL</Text>
                <Text style={labelStyle}>Hero Metric</Text>
              </SimpleGrid>

              {form.proofPoints.map((p, idx) => (
                <Paper key={idx} withBorder p="sm">
                  <Group gap={8} align="center" wrap="nowrap">
                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={8} style={{ flex: 1 }}>
                      <TextInput
                        placeholder="Launched real-time collab"
                        value={p.name}
                        onChange={(e) => handleProofField(idx, 'name', e.target.value)}
                        aria-label="Project name"
                      />
                      <TextInput
                        placeholder="https://example.com"
                        value={p.url}
                        onChange={(e) => handleProofField(idx, 'url', e.target.value)}
                        aria-label="URL"
                      />
                      <TextInput
                        placeholder="↑ 40% DAU in 6 weeks"
                        value={p.heroMetric}
                        onChange={(e) => handleProofField(idx, 'heroMetric', e.target.value)}
                        aria-label="Hero metric"
                      />
                    </SimpleGrid>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => handleProofRemove(idx)}
                      aria-label="Remove proof point"
                      style={{ flexShrink: 0 }}
                    >
                      <Trash size={14} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))}

              <Button
                variant="subtle"
                size="xs"
                onClick={handleProofAdd}
                style={{ alignSelf: 'flex-start' }}
              >
                + Add proof point
              </Button>
            </>
          )}
        </Stack>
      )}
    </Paper>
  )
}
