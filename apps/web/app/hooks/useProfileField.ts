'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useDebouncedCallback } from './useDebouncedCallback'
import type { SaveStatus } from '../components/config/SaveIndicator'

// parse and serialize must be stable references (module-level functions, not lambdas)
// — they are captured at mount and intentionally excluded from deps.
export function useProfileField<T extends Record<string, unknown>>(
  parse: (data: Record<string, unknown> | null) => T,
  serialize: (form: T) => Record<string, unknown>,
): {
  form: T | null
  handleChange: <K extends keyof T>(key: K, value: T[K]) => void
  saveStatus: SaveStatus
} {
  const [form, setForm] = useState<T | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const parseRef = useRef(parse)
  const serializeRef = useRef(serialize)

  useEffect(() => { parseRef.current = parse })
  useEffect(() => { serializeRef.current = serialize })

  useEffect(() => {
    fetch('/api/config/profile')
      .then((r) => r.json())
      .then(({ data }: { data: Record<string, unknown> | null }) => setForm(parseRef.current(data)))
      .catch(() => setForm(parseRef.current(null)))
  }, [])

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  const debouncedSave = useDebouncedCallback(async (data: T) => {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/config/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializeRef.current(data)),
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
    <K extends keyof T>(key: K, value: T[K]) => {
      setForm((prev) => {
        if (!prev) return prev
        const updated = { ...prev, [key]: value }
        debouncedSave(updated)
        return updated
      })
    },
    [debouncedSave],
  )

  return { form, handleChange, saveStatus }
}
