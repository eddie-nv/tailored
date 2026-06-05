'use client'

import { Paper, Group, Text, Stack, TextInput, SegmentedControl, Center, Loader } from '@mantine/core'
import { useProfileField } from '../../../../hooks/useProfileField'
import { SaveIndicator } from '../../SaveIndicator'

type WorkPrefsForm = {
  workType: string
  visaStatus: string
  onsiteAvailability: string
  timezone: string
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function parse(data: Record<string, unknown> | null): WorkPrefsForm {
  if (!data) return { workType: '', visaStatus: '', onsiteAvailability: '', timezone: '' }
  return {
    workType: str(data.workType),
    visaStatus: str(data.visaStatus),
    onsiteAvailability: str(data.onsiteAvailability),
    timezone: str(data.timezone),
  }
}

function serialize(form: WorkPrefsForm): Record<string, unknown> {
  return {
    workType: form.workType || null,
    visaStatus: form.visaStatus || null,
    onsiteAvailability: form.onsiteAvailability || null,
    timezone: form.timezone || null,
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

const WORK_TYPE_DATA = [
  { label: 'Remote', value: 'remote' },
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'Onsite', value: 'onsite' },
]

export function WorkPrefsTile() {
  const { form, handleChange, saveStatus } = useProfileField(parse, serialize)

  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 3' }} className="bento-tile">
      <Group justify="space-between" mb="md">
        <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed">
          Work Prefs
        </Text>
        <SaveIndicator status={saveStatus} />
      </Group>

      {!form ? (
        <Center h={120}>
          <Loader size="sm" color="var(--text-faint)" />
        </Center>
      ) : (
        <Stack gap={16}>
          <div>
            <Text style={labelStyle} mb={8}>Work Type</Text>
            <SegmentedControl
              fullWidth
              value={form.workType}
              onChange={(v) => handleChange('workType', v)}
              data={WORK_TYPE_DATA}
            />
          </div>
          <TextInput
            label="Visa Status"
            value={form.visaStatus}
            onChange={(e) => handleChange('visaStatus', e.target.value)}
            placeholder="No sponsorship needed"
            styles={{ label: labelStyle }}
          />
          <TextInput
            label="Onsite Availability"
            value={form.onsiteAvailability}
            onChange={(e) => handleChange('onsiteAvailability', e.target.value)}
            placeholder="1 week / month"
            styles={{ label: labelStyle }}
          />
          <TextInput
            label="Timezone"
            value={form.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
            placeholder="PST"
            styles={{ label: labelStyle }}
          />
        </Stack>
      )}
    </Paper>
  )
}
