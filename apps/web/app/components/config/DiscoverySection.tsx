'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CollapsibleSection } from './CollapsibleSection'
import { TagInput } from './TagInput'
import { PortalChecklist } from './PortalChecklist'
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

  if (!form) {
    return (
      <CollapsibleSection title="Discovery">
        <Spinner />
      </CollapsibleSection>
    )
  }

  return (
    <CollapsibleSection title="Discovery" saveStatus={saveStatus}>
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-3">
            Portals
          </p>
          <PortalChecklist
            value={form.portals}
            onChange={(v) => handleChange('portals', v)}
          />
        </div>

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

        <div>
          <label
            htmlFor="discovery-min-score"
            className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-2"
          >
            Minimum Score
          </label>
          <select
            id="discovery-min-score"
            value={form.minScore}
            onChange={(e) => handleChange('minScore', e.target.value as MinScore)}
            className="px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-white text-zinc-900 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          >
            <option value="">Any score</option>
            {(['A', 'B', 'C', 'D', 'F'] as const).map((score) => (
              <option key={score} value={score}>
                {score} or higher
              </option>
            ))}
          </select>
        </div>
      </div>
    </CollapsibleSection>
  )
}

function Spinner() {
  return (
    <div className="h-32 flex items-center justify-center">
      <div className="w-4 h-4 rounded-full border-2 border-zinc-200 border-t-zinc-400 animate-spin" />
    </div>
  )
}
