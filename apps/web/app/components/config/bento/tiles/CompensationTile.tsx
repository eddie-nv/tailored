'use client'

import { Paper, Group, Text, Stack, SimpleGrid, NumberInput, Select, TextInput, Center, Loader } from '@mantine/core'
import { useProfileField } from '../../../../hooks/useProfileField'
import { SaveIndicator } from '../../SaveIndicator'

type CompensationForm = {
  salaryMin: number | ''
  salaryMax: number | ''
  salaryFloor: number | ''
  currency: string
  locationFlexibility: string
}

function parse(data: Record<string, unknown> | null): CompensationForm {
  if (!data) return { salaryMin: '', salaryMax: '', salaryFloor: '', currency: 'USD', locationFlexibility: '' }
  return {
    salaryMin: typeof data.salaryMin === 'number' ? data.salaryMin : '',
    salaryMax: typeof data.salaryMax === 'number' ? data.salaryMax : '',
    salaryFloor: typeof data.salaryFloor === 'number' ? data.salaryFloor : '',
    currency: typeof data.currency === 'string' ? data.currency : 'USD',
    locationFlexibility: typeof data.locationFlexibility === 'string' ? data.locationFlexibility : '',
  }
}

function serialize(form: CompensationForm): Record<string, unknown> {
  return {
    salaryMin: form.salaryMin === '' ? null : Math.round(Number(form.salaryMin)),
    salaryMax: form.salaryMax === '' ? null : Math.round(Number(form.salaryMax)),
    salaryFloor: form.salaryFloor === '' ? null : Math.round(Number(form.salaryFloor)),
    currency: form.currency || null,
    locationFlexibility: form.locationFlexibility || null,
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

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']

export function CompensationTile() {
  const { form, handleChange, saveStatus } = useProfileField(parse, serialize)

  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 6' }} className="bento-tile">
      <Group justify="space-between" mb="md">
        <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed">
          Compensation
        </Text>
        <SaveIndicator status={saveStatus} />
      </Group>

      {!form ? (
        <Center h={120}>
          <Loader size="sm" color="var(--text-faint)" />
        </Center>
      ) : (
        <Stack gap={16}>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={12}>
            <NumberInput
              label="Salary Min"
              value={form.salaryMin}
              onChange={(v) => handleChange('salaryMin', v as number | '')}
              min={0}
              thousandSeparator=","
              leftSection={<Text size="sm" c="dimmed">$</Text>}
              placeholder="80,000"
              styles={{ label: labelStyle }}
            />
            <NumberInput
              label="Salary Max"
              value={form.salaryMax}
              onChange={(v) => handleChange('salaryMax', v as number | '')}
              min={0}
              thousandSeparator=","
              leftSection={<Text size="sm" c="dimmed">$</Text>}
              placeholder="160,000"
              styles={{ label: labelStyle }}
            />
          </SimpleGrid>

          <NumberInput
            label="Salary Floor (walk-away)"
            value={form.salaryFloor}
            onChange={(v) => handleChange('salaryFloor', v as number | '')}
            min={0}
            thousandSeparator=","
            leftSection={<Text size="sm" c="dimmed">$</Text>}
            placeholder="70,000"
            styles={{ label: labelStyle }}
          />

          <Select
            label="Currency"
            data={CURRENCY_OPTIONS}
            value={form.currency}
            onChange={(v) => handleChange('currency', v ?? 'USD')}
            searchable
            allowDeselect={false}
            styles={{ label: labelStyle }}
          />

          <TextInput
            label="Location Flexibility"
            value={form.locationFlexibility}
            onChange={(e) => handleChange('locationFlexibility', e.target.value)}
            placeholder="Open to Bay Area or NYC"
            styles={{ label: labelStyle }}
          />
        </Stack>
      )}
    </Paper>
  )
}
