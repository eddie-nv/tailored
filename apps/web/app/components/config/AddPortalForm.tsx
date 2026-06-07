'use client'

import { useState } from 'react'
import { Button, TextInput, Stack, SimpleGrid, NativeSelect, Text } from '@mantine/core'

type AddPortalFields = {
  name: string
  url: string
  provider: string | null
  api: string | null
  notes: string | null
}

type Props = {
  onAdd: (fields: AddPortalFields) => Promise<void>
}

const PROVIDER_OPTIONS = [
  { value: '', label: 'Auto-detect' },
  { value: 'Ashby', label: 'Ashby' },
  { value: 'Greenhouse', label: 'Greenhouse' },
  { value: 'Lever', label: 'Lever' },
  { value: 'Workable', label: 'Workable' },
]

function isValidHttpsUrl(url: string): boolean {
  if (!url.startsWith('https://')) return false
  try { new URL(url); return true } catch { return false }
}

export function AddPortalForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [provider, setProvider] = useState('')
  const [api, setApi] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const urlValid = url === '' || isValidHttpsUrl(url)
  const apiValid = api === '' || isValidHttpsUrl(api)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('Company name is required'); return }
    if (!url.trim()) { setError('Careers URL is required'); return }
    if (!urlValid) { setError('URL must be a valid https:// address'); return }
    if (provider === 'Greenhouse' && api && !apiValid) {
      setError('API endpoint must use https://'); return
    }
    setSubmitting(true)
    try {
      await onAdd({
        name: name.trim(),
        url: url.trim(),
        provider: provider || null,
        api: (provider === 'Greenhouse' && api.trim()) ? api.trim() : null,
        notes: notes.trim() || null,
      })
      setName('')
      setUrl('')
      setProvider('')
      setApi('')
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add portal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack component="form" gap={12} pt={12} style={{ borderTop: '1px solid var(--border)' }} onSubmit={handleSubmit}>
      <SimpleGrid cols={2} spacing={12}>
        <TextInput
          label="Company name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Anthropic"
          maxLength={100}
        />
        <TextInput
          label="Careers URL"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
        />
      </SimpleGrid>

      <SimpleGrid cols={2} spacing={12}>
        <NativeSelect
          label="Provider override"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          data={PROVIDER_OPTIONS}
        />
        <TextInput
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Berlin DE — voice AI platform"
          maxLength={200}
        />
      </SimpleGrid>

      {provider === 'Greenhouse' && (
        <TextInput
          label="API endpoint"
          type="url"
          value={api}
          onChange={(e) => setApi(e.target.value)}
          placeholder="https://boards-api.greenhouse.io/v1/boards/…"
        />
      )}

      {error && <Text size="xs" c="#ef4444">{error}</Text>}

      <Button type="submit" disabled={submitting} color="brand" size="xs">
        {submitting ? 'Adding…' : '+ Add portal'}
      </Button>
    </Stack>
  )
}
