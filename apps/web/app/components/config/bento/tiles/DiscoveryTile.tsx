'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Paper, Group, Text, Stack, NativeSelect, Center, Loader } from '@mantine/core'
import { TagInput } from '../../TagInput'
import { PortalManager } from '../../PortalManager'
import { SaveIndicator } from '../../SaveIndicator'
import { useDebouncedCallback } from '../../../../hooks/useDebouncedCallback'
import { safeParseJson } from '../../../../lib/json'
import type { SaveStatus } from '../../SaveIndicator'

type MinScore = '' | 'A' | 'B' | 'C' | 'D' | 'F'

type DiscoveryForm = {
  portals: string[]
  keywords: string[]
  archetypes: string[]
  minScore: MinScore
}

const LABEL_STYLES = {
  fontSize: '0.6875rem',
  fontWeight: 500 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: '#a1a1aa',
  marginBottom: 8,
}

function parseDiscovery(raw: Record<string, unknown> | null): DiscoveryForm {
  if (!raw) return { portals: [], keywords: [], archetypes: [], minScore: '' }
  return {
    portals: safeParseJson<string[]>(raw.portals, []),
    keywords: safeParseJson<string[]>(raw.keywords, []),
    archetypes: safeParseJson<string[]>(raw.archetypes, []),
    minScore: (raw.minScore as MinScore) ?? '',
  }
}

export function DiscoveryTile() {
  const [form, setForm] = useState<DiscoveryForm | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/config/discovery')
      .then((r) => r.json())
      .then(({ data }) => setForm(parseDiscovery(data)))
      .catch(() => setForm(parseDiscovery(null)))
  }, [])

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  const debouncedSave = useDebouncedCallback(async (data: DiscoveryForm) => {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/config/discovery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portals: data.portals,
          keywords: data.keywords,
          archetypes: data.archetypes,
          minScore: data.minScore || null,
        }),
      })
      if (!res.ok) throw new Error()
      setSaveStatus('saved')
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
    }
  }, 500)

  const handleChange = useCallback(
    <K extends keyof DiscoveryForm>(key: K, value: DiscoveryForm[K]) => {
      setForm((prev) => {
        if (!prev) return prev
        const updated = { ...prev, [key]: value }
        debouncedSave(updated)
        return updated
      })
    },
    [debouncedSave],
  )

  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 6' }} className="bento-tile">
      <Group justify="space-between" mb="md">
        <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed">
          Discovery
        </Text>
        <SaveIndicator status={saveStatus} />
      </Group>

      {!form ? (
        <Center h={120}>
          <Loader size="sm" color="var(--text-faint)" />
        </Center>
      ) : (
        <Stack gap={24}>
          <PortalManager
            presetValue={form.portals}
            onPresetChange={(v) => handleChange('portals', v)}
          />

          <TagInput
            label="Keywords"
            value={form.keywords}
            onChange={(v) => handleChange('keywords', v)}
            placeholder="e.g. TypeScript, distributed systems"
          />

          <TagInput
            label="Archetypes"
            value={form.archetypes}
            onChange={(v) => handleChange('archetypes', v)}
            placeholder="e.g. LLMOps, Agentic, PM"
          />

          <NativeSelect
            label="Minimum Score"
            value={form.minScore}
            onChange={(e) => handleChange('minScore', e.target.value as MinScore)}
            data={[
              { value: '', label: 'Any score' },
              ...(['A', 'B', 'C', 'D', 'F'] as const).map((score) => ({
                value: score,
                label: `${score} or higher`,
              })),
            ]}
            styles={{ label: LABEL_STYLES }}
          />
        </Stack>
      )}
    </Paper>
  )
}
