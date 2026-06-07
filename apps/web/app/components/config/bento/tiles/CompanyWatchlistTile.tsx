'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Paper, Group, Stack, Text, Center, Loader } from '@mantine/core'
import { SaveIndicator } from '../../SaveIndicator'
import { CustomPortalList } from '../../CustomPortalList'
import { AddPortalForm } from '../../AddPortalForm'
import type { SaveStatus } from '../../SaveIndicator'

type CustomPortal = {
  id: string
  name: string
  url: string
  enabled: boolean
  provider: string | null
  api: string | null
  notes: string | null
}

type AddPortalFields = {
  name: string
  url: string
  provider: string | null
  api: string | null
  notes: string | null
}

type UpdateFields = {
  provider: string | null
  api: string | null
  notes: string | null
}

export function CompanyWatchlistTile() {
  const [portals, setPortals] = useState<CustomPortal[]>([])
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/config/portals', { signal: controller.signal })
      .then((r) => r.json())
      .then(({ data }: { data: CustomPortal[] | null }) => setPortals(data ?? []))
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

  const handleAdd = useCallback(async (fields: AddPortalFields) => {
    setSaveStatus('saving')
    const res = await fetch('/api/config/portals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    const { data, error } = (await res.json()) as { data?: CustomPortal; error?: string }
    if (!res.ok) {
      setSaveStatus('error')
      throw new Error(error ?? 'Failed to add portal')
    }
    if (data) setPortals((prev) => [...prev, data])
    markSaved()
  }, [])

  const handleToggle = useCallback(async (id: string, enabled: boolean) => {
    setPortals((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)))
    await fetch(`/api/config/portals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    setPortals((prev) => prev.filter((p) => p.id !== id))
    await fetch(`/api/config/portals/${id}`, { method: 'DELETE' })
  }, [])

  const handleUpdate = useCallback(async (id: string, fields: UpdateFields) => {
    setSaveStatus('saving')
    const res = await fetch(`/api/config/portals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    if (!res.ok) {
      setSaveStatus('error')
      return
    }
    const { data } = (await res.json()) as { data?: CustomPortal }
    if (data) setPortals((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
    markSaved()
  }, [])

  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 5' }} className="bento-tile">
      <Group justify="space-between" mb="md">
        <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed">
          Company Watchlist
        </Text>
        <SaveIndicator status={saveStatus} />
      </Group>

      {loading ? (
        <Center h={80}>
          <Loader role="status" size="xs" color="var(--text-faint)" />
        </Center>
      ) : (
        <Stack gap={12}>
          <CustomPortalList
            portals={portals}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
          <AddPortalForm onAdd={handleAdd} />
        </Stack>
      )}
    </Paper>
  )
}
