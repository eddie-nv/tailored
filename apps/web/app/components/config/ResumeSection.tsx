'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  'summary',
  'experience',
  'skills',
  'education',
  'projects',
  'certifications',
]

const TEMPLATE_DESCRIPTIONS: Record<Template, string> = {
  default: 'Balanced layout with clear section headers',
  minimal: 'Clean single-column, less visual weight',
  dense: 'Compact 2-column, maximum content per page',
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
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
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
        <Spinner />
      </CollapsibleSection>
    )
  }

  return (
    <CollapsibleSection title="Resume" saveStatus={saveStatus}>
      <div className="space-y-6">
        <fieldset>
          <legend className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-3">
            Template
          </legend>
          <div className="space-y-2">
            {(['default', 'minimal', 'dense'] as const).map((t) => (
              <label
                key={t}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] border cursor-pointer transition-all ${
                  form.template === t
                    ? 'border-[var(--accent)] bg-blue-50/50'
                    : 'border-[var(--border)] hover:border-zinc-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="resume-template"
                  value={t}
                  checked={form.template === t}
                  onChange={() => handleChange('template', t)}
                  className="mt-0.5 accent-[var(--accent)]"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-900 capitalize">{t}</span>
                  <p className="text-xs text-zinc-400 mt-0.5">{TEMPLATE_DESCRIPTIONS[t]}</p>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-3">
            Section Order
          </p>
          <SectionOrderList
            sections={form.sectionOrder}
            onChange={(v) => handleChange('sectionOrder', v)}
          />
        </div>

        <div>
          <label
            htmlFor="resume-tone"
            className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-2"
          >
            Tone
          </label>
          <input
            id="resume-tone"
            type="text"
            value={form.tone}
            onChange={(e) => handleChange('tone', e.target.value)}
            placeholder="e.g. concise, technical, results-oriented"
            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-white text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <TagInput
          label="Emphasis Keywords"
          value={form.keywords}
          onChange={(v) => handleChange('keywords', v)}
          placeholder="e.g. distributed systems, team leadership"
        />
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
