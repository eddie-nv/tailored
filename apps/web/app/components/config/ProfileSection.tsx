'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Textarea, Stack, SimpleGrid, TextInput, Radio, Group, Center, Loader, Text } from '@mantine/core'
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
    return () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current) }
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
        <Center h={128}>
          <Loader size="sm" color="var(--text-faint)" />
        </Center>
      </CollapsibleSection>
    )
  }

  return (
    <CollapsibleSection title="Profile" saveStatus={saveStatus}>
      <Stack gap={20}>
        <Textarea
          label="CV / Resume"
          value={form.cv}
          onChange={(e) => handleChange('cv', e.target.value)}
          rows={8}
          placeholder="Paste your CV in markdown format…"
          autosize
          minRows={8}
          styles={{
            label: { fontSize: '0.6875rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', marginBottom: 8 },
            input: { fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.875rem', lineHeight: 1.6 },
          }}
        />

        <TagInput
          label="Target Roles"
          value={form.targetRoles}
          onChange={(v) => handleChange('targetRoles', v)}
          placeholder="e.g. Staff Engineer, Engineering Manager"
        />

        <SimpleGrid cols={2} spacing={16}>
          <TextInput
            label="Salary Min"
            type="number"
            min={0}
            value={form.salaryMin}
            onChange={(e) => handleChange('salaryMin', e.target.value)}
            placeholder="80000"
            leftSection={<Text size="sm" c="dimmed">$</Text>}
            styles={{ label: { fontSize: '0.6875rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', marginBottom: 8 } }}
          />
          <TextInput
            label="Salary Max"
            type="number"
            min={0}
            value={form.salaryMax}
            onChange={(e) => handleChange('salaryMax', e.target.value)}
            placeholder="160000"
            leftSection={<Text size="sm" c="dimmed">$</Text>}
            styles={{ label: { fontSize: '0.6875rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', marginBottom: 8 } }}
          />
        </SimpleGrid>

        <TextInput
          label="Location"
          value={form.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="San Francisco, CA"
          styles={{ label: { fontSize: '0.6875rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', marginBottom: 8 } }}
        />

        <Radio.Group
          label="Work Type"
          value={form.workType}
          onChange={(v) => handleChange('workType', v as WorkType)}
          styles={{ label: { fontSize: '0.6875rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', marginBottom: 8 } }}
        >
          <Group mt={8}>
            <Radio value="remote" label="Remote" />
            <Radio value="hybrid" label="Hybrid" />
            <Radio value="onsite" label="Onsite" />
          </Group>
        </Radio.Group>
      </Stack>
    </CollapsibleSection>
  )
}
