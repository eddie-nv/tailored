'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Paper,
  Group,
  Stack,
  Text,
  Button,
  Center,
  Loader,
  Modal,
  ScrollArea,
  Badge,
  Box,
} from '@mantine/core'
import { SaveIndicator } from '../../SaveIndicator'
import { SearchQueryList } from '../../SearchQueryList'
import { AddQueryForm } from '../../AddQueryForm'
import { QUERY_PRESETS, PRESET_CATEGORIES } from '../../QueryPresets'
import type { SaveStatus } from '../../SaveIndicator'

type SearchQuery = {
  id: string
  name: string
  query: string
  enabled: boolean
  createdAt: string
}

const CATEGORY_COLORS: Record<string, string> = {
  'AI/ML': '#7c3aed',
  'DevRel / SA / FDE': '#2563eb',
  'Automation': '#d97706',
  'Regional': '#059669',
  'Boards': '#6b7280',
}

export function DiscoveryQueriesTile() {
  const [queries, setQueries] = useState<SearchQuery[]>([])
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [presetsOpen, setPresetsOpen] = useState(false)
  const [importingId, setImportingId] = useState<string | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/config/search-queries', { signal: controller.signal })
      .then((r) => r.json())
      .then(({ data }: { data: SearchQuery[] | null }) => setQueries(data ?? []))
      .catch((err: unknown) => {
        if ((err as { name?: string }).name !== 'AbortError') setSaveStatus('error')
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  function markSaved() {
    setSaveStatus('saved')
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const handleAdd = useCallback(async (fields: { name: string; query: string }) => {
    setSaveStatus('saving')
    const res = await fetch('/api/config/search-queries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    const { data, error } = (await res.json()) as { data?: SearchQuery; error?: string }
    if (!res.ok) {
      setSaveStatus('error')
      throw new Error(error ?? 'Failed to add query')
    }
    if (data) setQueries((prev) => [...prev, data])
    markSaved()
  }, [])

  const handleToggle = useCallback(async (id: string, enabled: boolean) => {
    setQueries((prev) => prev.map((q) => (q.id === id ? { ...q, enabled } : q)))
    await fetch(`/api/config/search-queries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    setQueries((prev) => prev.filter((q) => q.id !== id))
    await fetch(`/api/config/search-queries/${id}`, { method: 'DELETE' })
  }, [])

  const handleUpdate = useCallback(
    async (id: string, fields: { name?: string; query?: string }) => {
      setSaveStatus('saving')
      const res = await fetch(`/api/config/search-queries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (!res.ok) {
        setSaveStatus('error')
        return
      }
      const { data } = (await res.json()) as { data?: SearchQuery }
      if (data) setQueries((prev) => prev.map((q) => (q.id === id ? { ...q, ...data } : q)))
      markSaved()
    },
    [],
  )

  const handleImportPreset = useCallback(
    async (presetName: string) => {
      const preset = QUERY_PRESETS.find((p) => p.name === presetName)
      if (!preset) return

      setImportingId(presetName)
      try {
        const res = await fetch('/api/config/search-queries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: preset.name, query: preset.query }),
        })
        const { data } = (await res.json()) as { data?: SearchQuery }
        if (data) {
          setQueries((prev) => [...prev, data])
          markSaved()
        }
      } finally {
        setImportingId(null)
      }
    },
    [],
  )

  return (
    <>
      <Paper withBorder p="lg" style={{ gridColumn: 'span 7' }} className="bento-tile">
        <Group justify="space-between" mb={6}>
          <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed">
            Discovery Queries
          </Text>
          <Group gap={8}>
            <SaveIndicator status={saveStatus} />
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              onClick={() => setPresetsOpen(true)}
            >
              Presets
            </Button>
          </Group>
        </Group>

        <Text size="xs" c="dimmed" mb="md" fs="italic">
          Results may be a few days old — sourced via web search
        </Text>

        {loading ? (
          <Center h={80}>
            <Loader role="status" size="xs" color="var(--text-faint)" />
          </Center>
        ) : (
          <Stack gap={12}>
            <SearchQueryList
              queries={queries}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
            <AddQueryForm onAdd={handleAdd} />
          </Stack>
        )}
      </Paper>

      <Modal
        opened={presetsOpen}
        onClose={() => setPresetsOpen(false)}
        title="Preset Library"
        size="lg"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Stack gap={24}>
          {PRESET_CATEGORIES.map((category) => {
            const categoryPresets = QUERY_PRESETS.filter((p) => p.category === category)
            return (
              <Stack key={category} gap={8}>
                <Group gap={8}>
                  <Badge
                    size="sm"
                    style={{
                      background: `${CATEGORY_COLORS[category] ?? '#6b7280'}18`,
                      color: CATEGORY_COLORS[category] ?? '#6b7280',
                    }}
                    fw={600}
                  >
                    {category}
                  </Badge>
                </Group>

                <Stack gap={6}>
                  {categoryPresets.map((preset) => (
                    <Paper
                      key={preset.name}
                      withBorder
                      p="10px 14px"
                      radius="sm"
                      bg="var(--mantine-color-body)"
                    >
                      <Group justify="space-between" wrap="nowrap" gap={12}>
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Text size="sm" fw={500} c="#27272a">
                            {preset.name}
                          </Text>
                          <Text
                            size="xs"
                            c="dimmed"
                            truncate
                            style={{ fontFamily: 'monospace', fontSize: '0.6875rem' }}
                          >
                            {preset.query.length > 80
                              ? `${preset.query.slice(0, 80)}…`
                              : preset.query}
                          </Text>
                        </Box>
                        <Button
                          size="xs"
                          variant="light"
                          color="brand"
                          loading={importingId === preset.name}
                          disabled={importingId !== null}
                          onClick={() => handleImportPreset(preset.name)}
                        >
                          Import
                        </Button>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            )
          })}
        </Stack>
      </Modal>
    </>
  )
}

