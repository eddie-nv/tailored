'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Paper,
  Group,
  Text,
  Stack,
  Badge,
  Center,
  Loader,
  Tooltip,
  NativeSelect,
  Divider,
} from '@mantine/core'
import { TagInput } from '../../TagInput'
import { SaveIndicator } from '../../SaveIndicator'
import { useDebouncedCallback } from '../../../../hooks/useDebouncedCallback'
import { useRoleDerivedTitles } from '../../../../providers/RoleTargetsProvider'
import type { SaveStatus } from '../../SaveIndicator'

type MinScore = '' | 'A' | 'B' | 'C' | 'D' | 'F'

type TitleFilter = {
  derived: string[]
  custom: string[]
  negative: string[]
  seniorityBoost: string[]
}

type LocationFilter = {
  derived: string[]
  alwaysAllow: string[]
  allow: string[]
  block: string[]
}

type SearchFiltersForm = {
  minScore: MinScore
  titleFilter: TitleFilter
  locationFilter: LocationFilter
}

const DEFAULT_SENIORITY_BOOST = ['Senior', 'Staff', 'Principal', 'Lead', 'Head', 'Director']

function parseForm(raw: Record<string, unknown> | null): SearchFiltersForm {
  const tf = raw?.titleFilter as TitleFilter | undefined
  const lf = raw?.locationFilter as LocationFilter | undefined
  return {
    minScore: (raw?.minScore as MinScore) ?? '',
    titleFilter: {
      derived: Array.isArray(tf?.derived) ? tf.derived : [],
      custom: Array.isArray(tf?.custom) ? tf.custom : [],
      negative: Array.isArray(tf?.negative) ? tf.negative : [],
      seniorityBoost: Array.isArray(tf?.seniorityBoost)
        ? tf.seniorityBoost
        : DEFAULT_SENIORITY_BOOST,
    },
    locationFilter: {
      derived: Array.isArray(lf?.derived) ? lf.derived : [],
      alwaysAllow: Array.isArray(lf?.alwaysAllow) ? lf.alwaysAllow : [],
      allow: Array.isArray(lf?.allow) ? lf.allow : [],
      block: Array.isArray(lf?.block) ? lf.block : [],
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

export function SearchFiltersTile() {
  const { derivedTitles } = useRoleDerivedTitles()
  const [form, setForm] = useState<SearchFiltersForm | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/config/discovery')
      .then((r) => r.json())
      .then(({ data }) => setForm(parseForm(data)))
      .catch(() => setForm(parseForm(null)))
  }, [])

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  const debouncedSave = useDebouncedCallback(async (data: SearchFiltersForm) => {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/config/discovery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minScore: data.minScore || null,
          titleFilter: {
            custom: data.titleFilter.custom,
            negative: data.titleFilter.negative,
            seniorityBoost: data.titleFilter.seniorityBoost,
          },
          locationFilter: {
            alwaysAllow: data.locationFilter.alwaysAllow,
            allow: data.locationFilter.allow,
            block: data.locationFilter.block,
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

  const handleMinScoreChange = useCallback(
    (value: string) => {
      setForm((prev) => {
        if (!prev) return prev
        const updated = { ...prev, minScore: value as MinScore }
        debouncedSave(updated)
        return updated
      })
    },
    [debouncedSave],
  )

  const handleTitleFilterChange = useCallback(
    (patch: Partial<TitleFilter>) => {
      setForm((prev) => {
        if (!prev) return prev
        const updated: SearchFiltersForm = {
          ...prev,
          titleFilter: { ...prev.titleFilter, ...patch },
        }
        debouncedSave(updated)
        return updated
      })
    },
    [debouncedSave],
  )

  const handleLocationChange = useCallback(
    (patch: Partial<Omit<LocationFilter, 'derived'>>) => {
      setForm((prev) => {
        if (!prev) return prev
        const updated: SearchFiltersForm = {
          ...prev,
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
          Search Filters
        </Text>
        <SaveIndicator status={saveStatus} />
      </Group>

      {!form ? (
        <Center h={120}>
          <Loader size="sm" color="var(--text-faint)" />
        </Center>
      ) : (
        <Stack gap={24}>
          <NativeSelect
            label="Minimum Score"
            value={form.minScore}
            onChange={(e) => handleMinScoreChange(e.target.value)}
            data={[
              { value: '', label: 'Any score' },
              ...(['A', 'B', 'C', 'D', 'F'] as const).map((score) => ({
                value: score,
                label: `${score} or higher`,
              })),
            ]}
            styles={{ label: LABEL_STYLES }}
          />

          <Stack gap={8}>
            <Text style={LABEL_STYLES}>Include jobs with these titles</Text>
            {derivedTitles.length > 0 && (
              <Group gap={6} wrap="wrap" mb={4}>
                {derivedTitles.map((title) => (
                  <Tooltip
                    key={title}
                    label="Synced from your primary roles"
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
                      {title}
                    </Badge>
                  </Tooltip>
                ))}
              </Group>
            )}
            <TagInput
              label=""
              value={form.titleFilter.custom}
              onChange={(v) => handleTitleFilterChange({ custom: v })}
              placeholder="Add custom title keywords"
            />
          </Stack>

          <TagInput
            label="Exclude jobs with these titles"
            value={form.titleFilter.negative}
            onChange={(v) => handleTitleFilterChange({ negative: v })}
            placeholder="e.g. intern, contractor, unpaid"
          />

          <Stack gap={4}>
            <TagInput
              label="Boost results with these seniority prefixes"
              value={form.titleFilter.seniorityBoost}
              onChange={(v) => handleTitleFilterChange({ seniorityBoost: v })}
              placeholder="e.g. Staff, Principal"
            />
            <Text size="xs" c="dimmed" mt={2}>
              Jobs with these prefixes rank higher but aren't required to match.
            </Text>
          </Stack>

          <Divider label="Location" labelPosition="left" />

          {form.locationFilter.derived.length > 0 && (
            <Stack gap={8}>
              <Text style={LABEL_STYLES}>Location hints from your profile</Text>
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
              onChange={(v) => handleLocationChange({ alwaysAllow: v })}
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
              onChange={(v) => handleLocationChange({ allow: v })}
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
              onChange={(v) => handleLocationChange({ block: v })}
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
