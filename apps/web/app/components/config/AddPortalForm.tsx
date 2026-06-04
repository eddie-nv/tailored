'use client'

import { useState } from 'react'
import { Button, TextInput, Stack, SimpleGrid, Text, Badge } from '@mantine/core'
import { detectPortalProvider } from '../../lib/detectPortalProvider'

type Props = {
  onAdd: (name: string, url: string) => Promise<void>
}

export function AddPortalForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const provider = url ? detectPortalProvider(url) : null
  const urlValid =
    url === '' ||
    (url.startsWith('https://') && (() => { try { new URL(url); return true } catch { return false } })())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('Company name is required'); return }
    if (!url.trim()) { setError('Careers URL is required'); return }
    if (!urlValid) { setError('URL must be a valid https:// address'); return }
    setSubmitting(true)
    try {
      await onAdd(name.trim(), url.trim())
      setName('')
      setUrl('')
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
          rightSection={
            provider && provider !== 'Unknown' ? (
              <Badge size="xs" variant="light" style={{ background: 'rgba(255, 56, 92, 0.1)', color: 'var(--accent)', fontSize: '0.625rem' }}>
                {provider}
              </Badge>
            ) : null
          }
        />
      </SimpleGrid>

      {error && <Text size="xs" c="#ef4444">{error}</Text>}

      <Button type="submit" disabled={submitting} color="brand" size="xs">
        {submitting ? 'Adding…' : '+ Add portal'}
      </Button>
    </Stack>
  )
}
