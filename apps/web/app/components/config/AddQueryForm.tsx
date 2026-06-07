'use client'

import { useState } from 'react'
import { Button, TextInput, Textarea, Stack, Text, Group } from '@mantine/core'

const MAX_QUERY_LENGTH = 500

type AddQueryFields = {
  name: string
  query: string
}

type Props = {
  onAdd: (fields: AddQueryFields) => Promise<void>
}

export function AddQueryForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const queryOverLimit = query.length > MAX_QUERY_LENGTH

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!query.trim()) {
      setError('Query is required')
      return
    }
    if (queryOverLimit) return

    setSubmitting(true)
    try {
      await onAdd({ name: name.trim(), query: query.trim() })
      setName('')
      setQuery('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add query')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack
      component="form"
      gap={10}
      pt={12}
      style={{ borderTop: '1px solid var(--border)' }}
      onSubmit={handleSubmit}
    >
      <TextInput
        label="Query name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Ashby — AI PM"
        maxLength={100}
        size="xs"
      />

      <Stack gap={4}>
        <Textarea
          label="Search query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='site:jobs.ashbyhq.com "AI Product Manager" remote'
          rows={2}
          size="xs"
          error={queryOverLimit ? `Query must be ${MAX_QUERY_LENGTH} characters or fewer` : undefined}
        />
        <Group justify="flex-end">
          <Text
            size="xs"
            c={queryOverLimit ? '#ef4444' : 'dimmed'}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {query.length} / {MAX_QUERY_LENGTH}
          </Text>
        </Group>
      </Stack>

      {error && (
        <Text size="xs" c="#ef4444">
          {error}
        </Text>
      )}

      <Button
        type="submit"
        color="brand"
        size="xs"
        disabled={submitting || queryOverLimit}
      >
        {submitting ? 'Adding…' : '+ Add query'}
      </Button>
    </Stack>
  )
}
