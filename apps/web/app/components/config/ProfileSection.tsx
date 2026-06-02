'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CollapsibleSection } from './CollapsibleSection'
import { TagInput } from './TagInput'
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback'
import { safeParseJson } from '../../lib/json'
import type { SaveStatus } from './SaveIndicator'

type WorkType = '' | 'remote' | 'hybrid' | 'onsite'

type ProfileForm = {
  cv: string
  targetRoles: string[]
  salaryMin: string
  salaryMax: string
  location: string
  workType: WorkType
}

function parseProfile(raw: Record<string, unknown> | null): ProfileForm {
  if (!raw)
    return { cv: '', targetRoles: [], salaryMin: '', salaryMax: '', location: '', workType: '' }
  return {
    cv: typeof raw.cv === 'string' ? raw.cv : '',
    targetRoles: safeParseJson<string[]>(raw.targetRoles, []),
    salaryMin: raw.salaryMin != null ? String(raw.salaryMin) : '',
    salaryMax: raw.salaryMax != null ? String(raw.salaryMax) : '',
    location: typeof raw.location === 'string' ? raw.location : '',
    workType: (raw.workType as WorkType) ?? '',
  }
}

export function ProfileSection() {
  const [form, setForm] = useState<ProfileForm | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/config/profile')
      .then((r) => r.json())
      .then(({ data }) => setForm(parseProfile(data)))
      .catch(() => setForm(parseProfile(null)))
  }, [])

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  const debouncedSave = useDebouncedCallback(async (data: ProfileForm) => {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/config/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cv: data.cv,
          targetRoles: data.targetRoles,
          salaryMin: data.salaryMin !== '' ? Number(data.salaryMin) : null,
          salaryMax: data.salaryMax !== '' ? Number(data.salaryMax) : null,
          location: data.location || null,
          workType: data.workType || null,
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
    <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
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
      <CollapsibleSection title="Profile">
        <Spinner />
      </CollapsibleSection>
    )
  }

  return (
    <CollapsibleSection title="Profile" saveStatus={saveStatus}>
      <div className="space-y-5">
        <div>
          <label
            htmlFor="profile-cv"
            className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-2"
          >
            CV / Resume
          </label>
          <textarea
            id="profile-cv"
            value={form.cv}
            onChange={(e) => handleChange('cv', e.target.value)}
            rows={8}
            placeholder="Paste your CV in markdown format…"
            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] resize-y bg-white text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] font-mono leading-relaxed"
          />
        </div>

        <TagInput
          label="Target Roles"
          value={form.targetRoles}
          onChange={(v) => handleChange('targetRoles', v)}
          placeholder="e.g. Staff Engineer, Engineering Manager"
        />

        <div className="grid grid-cols-2 gap-4">
          <SalaryField
            id="profile-salary-min"
            label="Salary Min"
            value={form.salaryMin}
            onChange={(v) => handleChange('salaryMin', v)}
            placeholder="80000"
          />
          <SalaryField
            id="profile-salary-max"
            label="Salary Max"
            value={form.salaryMax}
            onChange={(v) => handleChange('salaryMax', v)}
            placeholder="160000"
          />
        </div>

        <div>
          <label
            htmlFor="profile-location"
            className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-2"
          >
            Location
          </label>
          <input
            id="profile-location"
            type="text"
            value={form.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="San Francisco, CA"
            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-white text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <fieldset>
          <legend className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-2">
            Work Type
          </legend>
          <div className="flex gap-5">
            {(['remote', 'hybrid', 'onsite'] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="work-type"
                  value={type}
                  checked={form.workType === type}
                  onChange={() => handleChange('workType', type)}
                  className="accent-[var(--accent)]"
                />
                <span className="text-sm text-zinc-700 capitalize">{type}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </CollapsibleSection>
  )
}

function SalaryField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-2"
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm select-none">
          $
        </span>
        <input
          id={id}
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-6 pr-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-white text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
        />
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="h-32 flex items-center justify-center">
      <div className="w-4 h-4 rounded-full border-2 border-zinc-200 border-t-zinc-400 animate-spin" />
    </div>
  )
}
