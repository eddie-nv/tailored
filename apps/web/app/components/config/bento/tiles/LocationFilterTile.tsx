'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Paper, Group, Text, Stack, Badge, Center, Loader, Tooltip } from '@mantine/core'
import { TagInput } from '../../TagInput'
import { SaveIndicator } from '../../SaveIndicator'
import { useDebouncedCallback } from '../../../../hooks/useDebouncedCallback'
import type { SaveStatus } from '../../SaveIndicator'

type LocationFilter = {
  derived: string[]
  allow: string[]
  block: string[]
  alwaysAllow: string[]
}

type LocationFilterForm = {
  locationFilter: LocationFilter
}

function parseLocationFilter(raw: Record<string, unknown> | null): LocationFilterForm {
  const lf = raw?.locationFilter as LocationFilter | undefined
  return {
    locationFilter: {
      derived: Array.isArray(lf?.derived) ? lf.derived : [],
      allow: Array.isArray(lf?.allow) ? lf.allow : [],
      block: Array.isArray(lf?.block) ? lf.block : [],
      alwaysAllow: Array.isArray(lf?.alwaysAllow) ? lf.alwaysAllow : [],
    },
  }
}

const LABEL_STYLES = {
  fontSize: '0.6875rem',
  fontWeight: 500 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: '#a1a1aa',
  marginBottom: 8,
}

const LockIcon = () => (
  <svg width={9} height={9} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
  </svg>
)

export function LocationFilterTile() {
  const [form, setForm] = useState<LocationFilterForm | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/config/discovery')
      .then((r) => r.json())
      .then(({ data }) => setForm(parseLocationFilter(data)))
      .catch(() => setForm(parseLocationFilter(null)))
  }, [])

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  const debouncedSave = useDebouncedCallback(async (data: LocationFilterForm) => {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/config/discovery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationFilter: {
            allow: data.locationFilter.allow,
            block: data.locationFilter.block,
            alwaysAllow: data.locationFilter.alwaysAllow,
          },
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
    (patch: Partial<Omit<LocationFilter, 'derived'>>) => {
      setForm((prev) => {
        if (!prev) return prev
        const updated: LocationFilterForm = {
          locationFilter: { ...prev.locationFilter, ...patch },
        }
        debouncedSave(updated)
        return updated
      })
    },
    [debouncedSave],
  )

  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 5' }} className="bento-tile">
      <Group justify="space-between" mb="md">
        <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed">
          Location Filter
        </Text>
        <SaveIndicator status={saveStatus} />
      </Group>

      {!form ? (
        <Center h={120}>
          <Loader size="sm" color="var(--text-faint)" />
        </Center>
      ) : (
        <Stack gap={24}>
          {form.locationFilter.derived.length > 0 && (
            <Stack gap={8}>
              <Text style={LABEL_STYLES}>Derived from your profile</Text>
              <Group gap={6} wrap="wrap">
                {form.locationFilter.derived.map((hint) => (
                  <Tooltip
                    key={hint}
                    label="Synced from your work preferences"
                    position="top"
                    withArrow
                    fz="xs"
                  >
                    <Badge
                      variant="light"
                      color="blue"
                      size="sm"
                      leftSection={<LockIcon />}
                      style={{ cursor: 'default', userSelect: 'none' }}
                    >
                      {hint}
                    </Badge>
                  </Tooltip>
                ))}
              </Group>
            </Stack>
          )}

          <Stack gap={4}>
            <TagInput
              label="Always Allow"
              value={form.locationFilter.alwaysAllow}
              onChange={(v) => handleChange({ alwaysAllow: v })}
              placeholder="e.g. Remote, United States"
              color="teal"
            />
            <Text size="xs" c="dimmed" mt={2}>
              These locations always pass, even if on the block list.
            </Text>
          </Stack>

          <Stack gap={4}>
            <TagInput
              label="Allow"
              value={form.locationFilter.allow}
              onChange={(v) => handleChange({ allow: v })}
              placeholder="e.g. Europe, Canada"
            />
            <Text size="xs" c="dimmed" mt={2}>
              If set, jobs must match at least one. Empty means all locations pass.
            </Text>
          </Stack>

          <Stack gap={4}>
            <TagInput
              label="Block"
              value={form.locationFilter.block}
              onChange={(v) => handleChange({ block: v })}
              placeholder="e.g. China, requires relocation"
              color="red"
            />
            <Text size="xs" c="dimmed" mt={2}>
              Jobs matching these are excluded unless rescued by Always Allow.
            </Text>
          </Stack>
        </Stack>
      )}
    </Paper>
  )
}
