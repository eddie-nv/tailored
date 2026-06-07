'use client'

import { useState } from 'react'
import {
  Stack,
  Paper,
  Group,
  Box,
  Text,
  Anchor,
  Badge,
  ActionIcon,
  Switch,
  NativeSelect,
  TextInput,
  Button,
} from '@mantine/core'
import { detectPortalProvider } from '../../lib/detectPortalProvider'

type CustomPortal = {
  id: string
  name: string
  url: string
  enabled: boolean
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
  portals: CustomPortal[]
  onToggle: (id: string, enabled: boolean) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, fields: UpdateFields) => Promise<void>
}

const PROVIDER_OPTIONS = [
  { value: '', label: 'Auto-detect' },
  { value: 'Ashby', label: 'Ashby' },
  { value: 'Greenhouse', label: 'Greenhouse' },
  { value: 'Lever', label: 'Lever' },
  { value: 'Workable', label: 'Workable' },
]

function resolveProvider(portal: CustomPortal): string | null {
  if (portal.provider) return portal.provider
  const detected = detectPortalProvider(portal.url)
  return detected !== 'Unknown' ? detected : null
}

function PortalRow({
  portal,
  onToggle,
  onDelete,
  onUpdate,
}: {
  portal: CustomPortal
  onToggle: Props['onToggle']
  onDelete: Props['onDelete']
  onUpdate: Props['onUpdate']
}) {
  const [editing, setEditing] = useState(false)
  const [editProvider, setEditProvider] = useState(portal.provider ?? '')
  const [editApi, setEditApi] = useState(portal.api ?? '')
  const [editNotes, setEditNotes] = useState(portal.notes ?? '')
  const [saving, setSaving] = useState(false)

  const resolved = resolveProvider(portal)

  async function handleSave() {
    setSaving(true)
    try {
      await onUpdate(portal.id, {
        provider: editProvider || null,
        api: (editProvider === 'Greenhouse' && editApi.trim()) ? editApi.trim() : null,
        notes: editNotes.trim() || null,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function handleCancelEdit() {
    setEditProvider(portal.provider ?? '')
    setEditApi(portal.api ?? '')
    setEditNotes(portal.notes ?? '')
    setEditing(false)
  }

  return (
    <Paper component="li" className="portal-item" withBorder p="8px 12px" bg="white" radius="sm">
      <Group gap={12}>
        <Switch
          checked={portal.enabled}
          onChange={(e) => onToggle(portal.id, e.currentTarget.checked)}
          size="xs"
          aria-label={portal.enabled ? `Disable ${portal.name}` : `Enable ${portal.name}`}
        />

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={500} c="#27272a" truncate>
            {portal.name}
          </Text>
          <Anchor
            href={portal.url}
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            c="dimmed"
            truncate
            display="block"
          >
            {portal.url}
          </Anchor>
          {portal.notes && (
            <Text size="xs" c="dimmed" mt={2} style={{ maxWidth: '100%' }}>
              {portal.notes.length > 80 ? `${portal.notes.slice(0, 80)}…` : portal.notes}
            </Text>
          )}
        </Box>

        {resolved ? (
          <Badge
            size="xs"
            fw={600}
            style={{
              flexShrink: 0,
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              fontSize: '0.625rem',
            }}
          >
            {resolved}
          </Badge>
        ) : (
          <Badge
            size="xs"
            fw={600}
            style={{
              flexShrink: 0,
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#d97706',
              fontSize: '0.625rem',
            }}
          >
            Unsupported
          </Badge>
        )}

        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          type="button"
          onClick={() => setEditing((v) => !v)}
          aria-label={`Edit ${portal.name}`}
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
          onClick={() => onDelete(portal.id)}
          aria-label={`Remove ${portal.name}`}
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
        <Stack gap={8} mt={10} pt={10} style={{ borderTop: '1px solid var(--border-subtle, #3f3f46)' }}>
          <Group gap={8}>
            <NativeSelect
              label="Provider"
              value={editProvider}
              onChange={(e) => setEditProvider(e.target.value)}
              data={PROVIDER_OPTIONS}
              size="xs"
              style={{ flex: 1 }}
            />
            <TextInput
              label="Notes"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              maxLength={200}
              size="xs"
              style={{ flex: 2 }}
            />
          </Group>
          {editProvider === 'Greenhouse' && (
            <TextInput
              label="API endpoint"
              value={editApi}
              onChange={(e) => setEditApi(e.target.value)}
              placeholder="https://boards-api.greenhouse.io/v1/boards/…"
              size="xs"
            />
          )}
          <Group gap={8} justify="flex-end">
            <Button size="xs" variant="subtle" color="gray" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button size="xs" color="brand" onClick={handleSave} loading={saving}>
              Save
            </Button>
          </Group>
        </Stack>
      )}
    </Paper>
  )
}

export function CustomPortalList({ portals, onToggle, onDelete, onUpdate }: Props) {
  if (portals.length === 0) {
    return (
      <Text size="xs" c="#a1a1aa" fs="italic">
        No custom portals yet — add a company career page below.
      </Text>
    )
  }

  return (
    <Stack component="ul" gap={8} style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {portals.map((portal) => (
        <PortalRow
          key={portal.id}
          portal={portal}
          onToggle={onToggle}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </Stack>
  )
}
