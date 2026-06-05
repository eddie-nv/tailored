'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Paper, Group, Text, Stack, SegmentedControl, Radio, TextInput,
  Center, Loader,
} from '@mantine/core'
import { TagInput } from '../../TagInput'
import { SectionOrderList } from '../../SectionOrderList'
import { SaveIndicator } from '../../SaveIndicator'
import { useDebouncedCallback } from '../../../../hooks/useDebouncedCallback'
import { safeParseJson } from '../../../../lib/json'
import type { SaveStatus } from '../../SaveIndicator'

type Template = 'default' | 'minimal' | 'dense'
type CvFormat = 'html' | 'latex'

type CvOutputForm = {
  // resume prefs → /api/config/resume
  template: Template
  sectionOrder: string[]
  tone: string
  keywords: string[]
  // profile fields → /api/config/profile
  cvFormat: CvFormat
  canvaDesignId: string
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
  fontWeight: 500 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: '#a1a1aa',
  marginBottom: 8,
}

const RESUME_KEYS = new Set<keyof CvOutputForm>(['template', 'sectionOrder', 'tone', 'keywords'])
const PROFILE_KEYS = new Set<keyof CvOutputForm>(['cvFormat', 'canvaDesignId'])

const CV_FORMAT_DATA = [
  { label: 'HTML', value: 'html' },
  { label: 'LaTeX', value: 'latex' },
]

function defaultForm(): CvOutputForm {
  return {
    template: 'default',
    sectionOrder: DEFAULT_SECTION_ORDER,
    tone: '',
    keywords: [],
    cvFormat: 'html',
    canvaDesignId: '',
  }
}

export function CvOutputTile() {
  const [form, setForm] = useState<CvOutputForm | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/config/resume').then((r) => r.json()),
      fetch('/api/config/profile').then((r) => r.json()),
    ])
      .then(([resumeRes, profileRes]) => {
        const r = resumeRes.data ?? {}
        const p = profileRes.data ?? {}
        setForm({
          template: (r.template as Template) ?? 'default',
          sectionOrder: safeParseJson<string[]>(r.sectionOrder, DEFAULT_SECTION_ORDER),
          tone: typeof r.tone === 'string' ? r.tone : '',
          keywords: safeParseJson<string[]>(r.keywords, []),
          cvFormat: (p.cvFormat as CvFormat) ?? 'html',
          canvaDesignId: typeof p.canvaDesignId === 'string' ? p.canvaDesignId : '',
        })
      })
      .catch(() => setForm(defaultForm()))
  }, [])

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  const markSaved = useCallback(() => {
    setSaveStatus('saved')
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
  }, [])

  const debouncedSaveResume = useDebouncedCallback(async (data: CvOutputForm) => {
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
      markSaved()
    } catch {
      setSaveStatus('error')
    }
  }, 500)

  const debouncedSaveProfile = useDebouncedCallback(async (data: CvOutputForm) => {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/config/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvFormat: data.cvFormat,
          canvaDesignId: data.canvaDesignId || null,
        }),
      })
      if (!res.ok) throw new Error()
      markSaved()
    } catch {
      setSaveStatus('error')
    }
  }, 500)

  const handleChange = useCallback(
    <K extends keyof CvOutputForm>(key: K, value: CvOutputForm[K]) => {
      setForm((prev) => {
        if (!prev) return prev
        const updated = { ...prev, [key]: value }
        if (RESUME_KEYS.has(key)) debouncedSaveResume(updated)
        else if (PROFILE_KEYS.has(key)) debouncedSaveProfile(updated)
        return updated
      })
    },
    [debouncedSaveResume, debouncedSaveProfile],
  )

  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 6' }} className="bento-tile">
      <Group justify="space-between" mb="md">
        <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed">
          CV Output
        </Text>
        <SaveIndicator status={saveStatus} />
      </Group>

      {!form ? (
        <Center h={120}>
          <Loader size="sm" color="var(--text-faint)" />
        </Center>
      ) : (
        <Stack gap={24}>
          <div>
            <Text style={FIELD_LABEL_STYLES} mb={8}>Format</Text>
            <SegmentedControl
              fullWidth
              value={form.cvFormat}
              onChange={(v) => handleChange('cvFormat', v as CvFormat)}
              data={CV_FORMAT_DATA}
            />
          </div>

          {form.cvFormat === 'html' && (
            <TextInput
              label="Canva Design ID"
              value={form.canvaDesignId}
              onChange={(e) => handleChange('canvaDesignId', e.target.value)}
              placeholder="DAxxxxxxxxxxxxxxxx"
              styles={{ label: FIELD_LABEL_STYLES }}
            />
          )}

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
            <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="#a1a1aa" mb={8}>
              Section Order
            </Text>
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
      )}
    </Paper>
  )
}
