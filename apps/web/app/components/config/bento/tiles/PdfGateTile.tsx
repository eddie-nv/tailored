'use client'

import { Paper, Group, Text, Stack, Slider, Center, Loader } from '@mantine/core'
import { useProfileField } from '../../../../hooks/useProfileField'
import { SaveIndicator } from '../../SaveIndicator'

type PdfGateForm = {
  autoPdfThreshold: number
}

function parse(data: Record<string, unknown> | null): PdfGateForm {
  return {
    autoPdfThreshold: typeof data?.autoPdfThreshold === 'number' ? data.autoPdfThreshold : 0,
  }
}

function serialize(form: PdfGateForm): Record<string, unknown> {
  return { autoPdfThreshold: form.autoPdfThreshold }
}

const SLIDER_MARKS = [0, 1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }))

export function PdfGateTile() {
  const { form, handleChange, saveStatus } = useProfileField(parse, serialize)

  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 4' }} className="bento-tile">
      <Group justify="space-between" mb="md">
        <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed">
          PDF Gate
        </Text>
        <SaveIndicator status={saveStatus} />
      </Group>

      {!form ? (
        <Center h={120}>
          <Loader size="sm" color="var(--text-faint)" />
        </Center>
      ) : (
        <Stack gap={24} pt={4}>
          <Group gap={8} align="baseline">
            <Text size="sm" c="dimmed">Auto-generate PDF when score ≥</Text>
            <Text size="sm" fw={700} c="var(--accent)">
              {form.autoPdfThreshold % 1 === 0
                ? form.autoPdfThreshold.toFixed(0)
                : form.autoPdfThreshold.toFixed(1)}
            </Text>
          </Group>

          <Slider
            value={form.autoPdfThreshold}
            onChange={(v) => handleChange('autoPdfThreshold', v)}
            min={0}
            max={5}
            step={0.5}
            marks={SLIDER_MARKS}
            color="var(--accent)"
            mb={16}
          />

          <Text size="xs" c="dimmed" lh={1.5}>
            Set to 0 to always generate. Raise to 4+ to reserve PDFs for strong matches.
          </Text>
        </Stack>
      )}
    </Paper>
  )
}
