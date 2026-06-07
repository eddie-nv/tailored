'use client'

import { useState } from 'react'
import { Stack, Paper, Group, Box, Text, ActionIcon, Switch, Textarea, TextInput, Button } from '@mantine/core'

type SearchQuery = {
  id: string
  name: string
  query: string
  enabled: boolean
  createdAt: string
}

type UpdateFields = {
  name?: string
  query?: string
  enabled?: boolean
}

type Props = {
  queries: SearchQuery[]
  onToggle: (id: string, enabled: boolean) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, fields: UpdateFields) => Promise<void>
}

const MAX_QUERY_LENGTH = 500

function QueryRow({
  query,
  onToggle,
  onDelete,
  onUpdate,
}: {
  query: SearchQuery
  onToggle: Props['onToggle']
  onDelete: Props['onDelete']
  onUpdate: Props['onUpdate']
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(query.name)
  const [editQuery, setEditQuery] = useState(query.query)
  const [saving, setSaving] = useState(false)

  const queryOverLimit = editQuery.length > MAX_QUERY_LENGTH
  const truncated = query.query.length > 72 ? `${query.query.slice(0, 72)}…` : query.query

  async function handleSave() {
    if (queryOverLimit) return
    setSaving(true)
    try {
      await onUpdate(query.id, { name: editName.trim(), query: editQuery.trim() })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function handleCancelEdit() {
    setEditName(query.name)
    setEditQuery(query.query)
    setEditing(false)
  }

  return (
    <Paper
      component="li"
      withBorder
      p="8px 12px"
      bg="var(--mantine-color-body)"
      radius="sm"
      style={{ opacity: query.enabled ? 1 : 0.6, transition: 'opacity 150ms' }}
    >
      <Group gap={10} wrap="nowrap">
        <Switch
          checked={query.enabled}
          onChange={(e) => onToggle(query.id, e.currentTarget.checked)}
          size="xs"
          aria-label={query.enabled ? `Disable ${query.name}` : `Enable ${query.name}`}
        />

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={500} c="#27272a" truncate>
            {query.name}
          </Text>
          <Text size="xs" c="dimmed" truncate style={{ fontFamily: 'monospace', fontSize: '0.6875rem' }}>
            {truncated}
          </Text>
        </Box>

        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          type="button"
          onClick={() => setEditing((v) => !v)}
          aria-label={`Edit ${query.name}`}
          style={{ flexShrink: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </ActionIcon>

        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          type="button"
          onClick={() => onDelete(query.id)}
          aria-label={`Remove ${query.name}`}
          style={{ flexShrink: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M2 2l10 10M12 2L2 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </ActionIcon>
      </Group>

      {editing && (
        <Stack
          gap={8}
          mt={10}
          pt={10}
          style={{ borderTop: '1px solid var(--border-subtle, #3f3f46)' }}
        >
          <TextInput
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            maxLength={100}
            size="xs"
          />
          <Textarea
            label="Query"
            value={editQuery}
            onChange={(e) => setEditQuery(e.target.value)}
            rows={2}
            size="xs"
            error={
              queryOverLimit ? `Must be ${MAX_QUERY_LENGTH} characters or fewer` : undefined
            }
            rightSection={
              <Text
                size="xs"
                c={queryOverLimit ? '#ef4444' : 'dimmed'}
                style={{ position: 'absolute', bottom: 4, right: 8, fontSize: '0.625rem' }}
              >
                {editQuery.length}/{MAX_QUERY_LENGTH}
              </Text>
            }
          />
          <Group gap={8} justify="flex-end">
            <Button size="xs" variant="subtle" color="gray" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button
              size="xs"
              color="brand"
              onClick={handleSave}
              loading={saving}
              disabled={queryOverLimit}
            >
              Save
            </Button>
          </Group>
        </Stack>
      )}
    </Paper>
  )
}

export function SearchQueryList({ queries, onToggle, onDelete, onUpdate }: Props) {
  if (queries.length === 0) {
    return (
      <Text size="xs" c="#a1a1aa" fs="italic">
        No search queries yet — add one below or import from presets.
      </Text>
    )
  }

  return (
    <Stack component="ul" gap={6} style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {queries.map((q) => (
        <QueryRow
          key={q.id}
          query={q}
          onToggle={onToggle}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </Stack>
  )
}
