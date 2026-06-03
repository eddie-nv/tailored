'use client'

import { useCallback } from 'react'
import { PORTAL_GROUPS } from './portals'

type Props = {
  value: string[]
  onChange: (portals: string[]) => void
}

export function PresetPortals({ value, onChange }: Props) {
  const selectedSet = new Set(value)

  const toggle = useCallback(
    (key: string) => {
      const next = new Set(selectedSet)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      onChange([...next])
    },
    [selectedSet, onChange],
  )

  const toggleGroup = useCallback(
    (keys: string[]) => {
      const allSelected = keys.every((k) => selectedSet.has(k))
      const next = new Set(selectedSet)
      if (allSelected) {
        keys.forEach((k) => next.delete(k))
      } else {
        keys.forEach((k) => next.add(k))
      }
      onChange([...next])
    },
    [selectedSet, onChange],
  )

  return (
    <div className="space-y-5">
      {PORTAL_GROUPS.map((group) => {
        const groupKeys = group.portals.map((p) => p.key)
        const allSelected = groupKeys.every((k) => selectedSet.has(k))
        const someSelected = !allSelected && groupKeys.some((k) => selectedSet.has(k))

        return (
          <div key={group.name}>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id={`group-${group.name}`}
                checked={allSelected}
                ref={(el: HTMLInputElement | null) => {
                  if (el) el.indeterminate = someSelected
                }}
                onChange={() => toggleGroup(groupKeys)}
                className="w-3.5 h-3.5 rounded border-zinc-300 accent-[var(--accent)]"
              />
              <label
                htmlFor={`group-${group.name}`}
                className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 cursor-pointer"
              >
                {group.name}
              </label>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pl-5">
              {group.portals.map((portal) => (
                <label key={portal.key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(portal.key)}
                    onChange={() => toggle(portal.key)}
                    className="w-3.5 h-3.5 rounded border-zinc-300 accent-[var(--accent)]"
                  />
                  <span className="text-sm text-zinc-700 group-hover:text-zinc-900 transition-colors">
                    {portal.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
