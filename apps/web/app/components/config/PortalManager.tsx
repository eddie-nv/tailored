'use client'

import { useState, useEffect, useCallback } from 'react'
import { Stack, Text, Center, Loader } from '@mantine/core'
import { PresetPortals } from './PresetPortals'
import { CustomPortalList } from './CustomPortalList'
import { AddPortalForm } from './AddPortalForm'

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

type Props = {
  presetValue: string[]
  onPresetChange: (portals: string[]) => void
}

export function PortalManager({ presetValue, onPresetChange }: Props) {
  const [customPortals, setCustomPortals] = useState<CustomPortal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/config/portals')
      .then((r) => r.json())
      .then(({ data }) => setCustomPortals(data ?? []))
      .catch(() => setCustomPortals([]))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = useCallback(async (fields: AddPortalFields) => {
    const res = await fetch('/api/config/portals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    const { data, error } = await res.json()
    if (!res.ok) throw new Error(error ?? 'Failed to add portal')
    setCustomPortals((prev) => [...prev, data])
  }, [])

  const handleToggle = useCallback(async (id: string, enabled: boolean) => {
    setCustomPortals((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)))
    await fetch(`/api/config/portals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    setCustomPortals((prev) => prev.filter((p) => p.id !== id))
    await fetch(`/api/config/portals/${id}`, { method: 'DELETE' })
  }, [])

  const handleUpdate = useCallback(async (id: string, fields: UpdateFields) => {
    const res = await fetch(`/api/config/portals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    if (!res.ok) return
    const { data } = await res.json()
    setCustomPortals((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
  }, [])

  return (
    <Stack gap={24}>
      <Stack gap={12}>
        <Text size="xs" fw={600} tt="uppercase" lts="0.1em" c="#71717a">Job Boards</Text>
        <PresetPortals value={presetValue} onChange={onPresetChange} />
      </Stack>

      <Stack gap={12}>
        <Text size="xs" fw={600} tt="uppercase" lts="0.1em" c="#71717a">Company Career Pages</Text>
        {loading ? (
          <Center h={32}>
            <Loader size="xs" color="var(--text-faint)" />
          </Center>
        ) : (
          <Stack gap={12}>
            <CustomPortalList portals={customPortals} onToggle={handleToggle} onDelete={handleDelete} onUpdate={handleUpdate} />
            <AddPortalForm onAdd={handleAdd} />
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
