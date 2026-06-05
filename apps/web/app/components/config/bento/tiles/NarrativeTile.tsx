'use client'

import { Paper, Group, Text, Stack, TextInput, Textarea, Center, Loader } from '@mantine/core'
import { useProfileField } from '../../../../hooks/useProfileField'
import { SaveIndicator } from '../../SaveIndicator'
import { TagInput } from '../../TagInput'

type NarrativeForm = {
  headline: string
  exitStory: string
  superpowers: string[]
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function parse(data: Record<string, unknown> | null): NarrativeForm {
  if (!data) return { headline: '', exitStory: '', superpowers: [] }
  return {
    headline: str(data.headline),
    exitStory: str(data.exitStory),
    superpowers: Array.isArray(data.superpowers) ? (data.superpowers as string[]) : [],
  }
}

function serialize(form: NarrativeForm): Record<string, unknown> {
  return {
    headline: form.headline || null,
    exitStory: form.exitStory || null,
    superpowers: form.superpowers.length > 0 ? form.superpowers : null,
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

export function NarrativeTile() {
  const { form, handleChange, saveStatus } = useProfileField(parse, serialize)

  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 8' }} className="bento-tile">
      <Group justify="space-between" mb="md">
        <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed">
          Narrative
        </Text>
        <SaveIndicator status={saveStatus} />
      </Group>

      {!form ? (
        <Center h={120}>
          <Loader size="sm" color="var(--text-faint)" />
        </Center>
      ) : (
        <Stack gap={20}>
          <TextInput
            label="Headline"
            value={form.headline}
            onChange={(e) => handleChange('headline', e.target.value)}
            placeholder="Staff engineer who ships AI-powered products end-to-end"
            styles={{ label: labelStyle }}
          />
          <Textarea
            label="Exit Story"
            value={form.exitStory}
            onChange={(e) => handleChange('exitStory', e.target.value)}
            placeholder="What you're looking for and why now…"
            autosize
            minRows={4}
            styles={{ label: labelStyle }}
          />
          <TagInput
            label="Superpowers"
            value={form.superpowers}
            onChange={(v) => handleChange('superpowers', v)}
            placeholder="e.g. Systems thinking, Shipping fast, Cross-functional leadership"
          />
        </Stack>
      )}
    </Paper>
  )
}
