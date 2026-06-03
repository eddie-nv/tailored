'use client'

import { useState, useEffect, useCallback } from 'react'
import { PresetPortals } from './PresetPortals'
import { CustomPortalList } from './CustomPortalList'
import { AddPortalForm } from './AddPortalForm'

type CustomPortal = {
  id: string
  name: string
  url: string
  enabled: boolean
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

  const handleAdd = useCallback(async (name: string, url: string) => {
    const res = await fetch('/api/config/portals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url }),
    })
    const { data, error } = await res.json()
    if (!res.ok) throw new Error(error ?? 'Failed to add portal')
    setCustomPortals((prev) => [...prev, data])
  }, [])

  const handleToggle = useCallback(async (id: string, enabled: boolean) => {
    setCustomPortals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled } : p)),
    )
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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">
          Job Boards
        </p>
        <PresetPortals value={presetValue} onChange={onPresetChange} />
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">
          Company Career Pages
        </p>
        {loading ? (
          <div className="h-8 flex items-center">
            <div className="w-3 h-3 rounded-full border-2 border-zinc-200 border-t-zinc-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <CustomPortalList
              portals={customPortals}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
            <AddPortalForm onAdd={handleAdd} />
          </div>
        )}
      </div>
    </div>
  )
}
