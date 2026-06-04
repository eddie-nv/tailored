'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Stack, NativeSelect, Center, Loader } from '@mantine/core'
import { CollapsibleSection } from './CollapsibleSection'
import { TagInput } from './TagInput'
import { PortalManager } from './PortalManager'
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback'
import { safeParseJson } from '../../lib/json'
import type { SaveStatus } from './SaveIndicator'

type MinScore = '' | 'A' | 'B' | 'C' | 'D' | 'F'

type DiscoveryForm = {
  portals: string[]
  keywords: string[]
  archetypes: string[]
  minScore: MinScore
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

export function DiscoverySection() {
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
    return () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current) }
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

  if (!form) {
    return (
      <CollapsibleSection title="Discovery">
        <Center h={128}>
          <Loader size="sm" color="var(--text-faint)" />
        </Center>
      </CollapsibleSection>
    )
  }

  return (
    <CollapsibleSection title="Discovery" saveStatus={saveStatus}>
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
          styles={{ label: { fontSize: '0.6875rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', marginBottom: 8 } }}
        />
      </Stack>
    </CollapsibleSection>
  )
}
