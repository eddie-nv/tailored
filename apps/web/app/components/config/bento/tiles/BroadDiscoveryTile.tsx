'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Paper,
  Group,
  Stack,
  Text,
  Switch,
  NativeSelect,
  Center,
  Loader,
  Box,
} from '@mantine/core'
import { SaveIndicator } from '../../SaveIndicator'
import { useDebouncedCallback } from '../../../../hooks/useDebouncedCallback'
import { PORTAL_GROUPS } from '../../portals'
import type { SaveStatus } from '../../SaveIndicator'

type Platform = 'ashby' | 'greenhouse' | 'lever'
type MinScore = '' | 'A' | 'B' | 'C' | 'D' | 'F'

type BroadDiscoveryForm = {
  platforms: Platform[]
  minScore: MinScore
}

const PLATFORMS: Platform[] = ['ashby', 'greenhouse', 'lever']
const PLATFORM_KEYS = new Set<string>(PLATFORMS)

const PLATFORM_META: Record<Platform, { label: string; tagline: string; count: number }> = {
  ashby: {
    label: 'Ashby',
    tagline: 'AI/dev-tool startups',
    count: PORTAL_GROUPS.find((g) => g.name === 'Ashby')?.portals.length ?? 0,
  },
  greenhouse: {
    label: 'Greenhouse',
    tagline: 'Enterprise & growth-stage',
    count: PORTAL_GROUPS.find((g) => g.name === 'Greenhouse')?.portals.length ?? 0,
  },
  lever: {
    label: 'Lever',
    tagline: 'Series A–C startups',
    count: PORTAL_GROUPS.find((g) => g.name === 'Lever')?.portals.length ?? 0,
  },
}

const LABEL_STYLES = {
  fontSize: '0.6875rem',
  fontWeight: 500 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: '#a1a1aa',
  marginBottom: 8,
}

function parseForm(raw: Record<string, unknown> | null): BroadDiscoveryForm {
  const portals = Array.isArray(raw?.portals) ? (raw.portals as string[]) : []
  const platforms = portals.filter((p): p is Platform => PLATFORM_KEYS.has(p))
  return {
    platforms,
    minScore: (raw?.minScore as MinScore) ?? '',
  }
}

export function BroadDiscoveryTile() {
  const [form, setForm] = useState<BroadDiscoveryForm | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/config/discovery', { signal: controller.signal })
      .then((r) => r.json())
      .then(({ data }: { data: Record<string, unknown> | null }) => setForm(parseForm(data)))
      .catch((err: unknown) => {
        if ((err as { name?: string }).name !== 'AbortError') setLoadError(true)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  const debouncedSave = useDebouncedCallback(async (data: BroadDiscoveryForm) => {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/config/discovery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portals: data.platforms,
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

  const handlePlatformToggle = useCallback(
    (platform: Platform, enabled: boolean) => {
      setForm((prev) => {
        if (!prev) return prev
        const platforms = enabled
          ? [...prev.platforms, platform]
          : prev.platforms.filter((p) => p !== platform)
        const updated = { ...prev, platforms }
        debouncedSave(updated)
        return updated
      })
    },
    [debouncedSave],
  )

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

  if (loadError) {
    return (
      <Paper withBorder p="lg" style={{ gridColumn: 'span 7' }} className="bento-tile">
        <Text role="alert" c="red" fz="sm">
          Failed to load scanner settings.
        </Text>
      </Paper>
    )
  }

  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 7' }} className="bento-tile">
      <Group justify="space-between" mb="md">
        <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed">
          Broad Discovery
        </Text>
        <SaveIndicator status={saveStatus} />
      </Group>

      {!form ? (
        <Center h={120}>
          <Loader role="status" size="sm" color="var(--text-faint)" />
        </Center>
      ) : (
        <Stack gap={20}>
          <Stack gap={8}>
            <Text style={LABEL_STYLES}>Platforms</Text>
            <Group gap={12} grow>
              {PLATFORMS.map((platform) => {
                const meta = PLATFORM_META[platform]
                const enabled = form.platforms.includes(platform)
                return (
                  <Box
                    key={platform}
                    p="md"
                    style={{
                      border: `1px solid ${enabled ? 'var(--mantine-color-blue-5, #4dabf7)' : 'var(--border-subtle, #27272a)'}`,
                      borderRadius: 8,
                      background: enabled ? 'rgba(77, 171, 247, 0.06)' : 'transparent',
                      transition: 'border-color 150ms ease, background 150ms ease',
                    }}
                  >
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Stack gap={2}>
                        <Text fw={600} fz="sm">
                          {meta.label}
                        </Text>
                        <Text fz="xs" c="dimmed">
                          {meta.tagline}
                        </Text>
                        <Text fz={11} c="dimmed" mt={4}>
                          ~{meta.count} companies
                        </Text>
                      </Stack>
                      <Switch
                        checked={enabled}
                        onChange={(e) =>
                          handlePlatformToggle(platform, e.currentTarget.checked)
                        }
                        aria-label={`Enable ${meta.label}`}
                        size="sm"
                      />
                    </Group>
                  </Box>
                )
              })}
            </Group>
          </Stack>

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
        </Stack>
      )}
    </Paper>
  )
}
