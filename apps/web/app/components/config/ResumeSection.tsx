'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Stack, Radio, Paper, Text, TextInput, Textarea, Center, Loader } from '@mantine/core'
import { CollapsibleSection } from './CollapsibleSection'
import { TagInput } from './TagInput'
import { SectionOrderList } from './SectionOrderList'
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback'
import { safeParseJson } from '../../lib/json'
import type { SaveStatus } from './SaveIndicator'

type Template = 'default' | 'minimal' | 'dense'

type ResumeForm = {
  template: Template
  sectionOrder: string[]
  tone: string
  keywords: string[]
}

const DEFAULT_SECTION_ORDER = [
  'summary', 'experience', 'skills', 'education', 'projects', 'certifications',
]

const TEMPLATE_DESCRIPTIONS: Record<Template, string> = {
  default: 'Balanced layout with clear section headers',
  minimal: 'Clean single-column, less visual weight',
  dense: 'Compact 2-column, maximum content per page',
}

const FIELD_LABEL_STYLES = {
  fontSize: '0.6875rem',
  fontWeight: 500,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: '#a1a1aa',
  marginBottom: 8,
}

function parseResume(raw: Record<string, unknown> | null): ResumeForm {
  if (!raw)
    return { template: 'default', sectionOrder: DEFAULT_SECTION_ORDER, tone: '', keywords: [] }
  return {
    template: (raw.template as Template) ?? 'default',
    sectionOrder: safeParseJson<string[]>(raw.sectionOrder, DEFAULT_SECTION_ORDER),
    tone: typeof raw.tone === 'string' ? raw.tone : '',
    keywords: safeParseJson<string[]>(raw.keywords, []),
  }
}

export function ResumeSection() {
  const [form, setForm] = useState<ResumeForm | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/config/resume')
      .then((r) => r.json())
      .then(({ data }) => setForm(parseResume(data)))
      .catch(() => setForm(parseResume(null)))
  }, [])

  useEffect(() => {
    return () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current) }
  }, [])

  const debouncedSave = useDebouncedCallback(async (data: ResumeForm) => {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/config/resume', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: data.template,
          sectionOrder: data.sectionOrder,
          tone: data.tone || null,
          keywords: data.keywords,
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
    <K extends keyof ResumeForm>(key: K, value: ResumeForm[K]) => {
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
      <CollapsibleSection title="Resume">
        <Center h={128}>
          <Loader size="sm" color="var(--text-faint)" />
        </Center>
      </CollapsibleSection>
    )
  }

  return (
    <CollapsibleSection title="Resume" saveStatus={saveStatus}>
      <Stack gap={24}>
        <Radio.Group
          label="Template"
          value={form.template}
          onChange={(v) => handleChange('template', v as Template)}
          styles={{ label: FIELD_LABEL_STYLES }}
        >
          <Stack gap="xs" mt={8}>
            {(['default', 'minimal', 'dense'] as const).map((t) => (
              <Paper
                key={t}
                withBorder
                p="sm"
                className="template-card"
                data-selected={form.template === t ? 'true' : undefined}
                style={{ cursor: 'pointer' }}
              >
                <Radio
                  value={t}
                  label={
                    <Stack gap={2}>
                      <Text size="sm" fw={500} tt="capitalize">{t}</Text>
                      <Text size="xs" c="dimmed">{TEMPLATE_DESCRIPTIONS[t]}</Text>
                    </Stack>
                  }
                />
              </Paper>
            ))}
          </Stack>
        </Radio.Group>

        <div>
          <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="#a1a1aa" mb={8}>Section Order</Text>
          <SectionOrderList
            sections={form.sectionOrder}
            onChange={(v) => handleChange('sectionOrder', v)}
          />
        </div>

        <TextInput
          label="Tone"
          value={form.tone}
          onChange={(e) => handleChange('tone', e.target.value)}
          placeholder="e.g. concise, technical, results-oriented"
          styles={{ label: FIELD_LABEL_STYLES }}
        />

        <TagInput
          label="Emphasis Keywords"
          value={form.keywords}
          onChange={(v) => handleChange('keywords', v)}
          placeholder="e.g. distributed systems, team leadership"
        />
      </Stack>
    </CollapsibleSection>
  )
}
