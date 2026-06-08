'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Paper,
  Group,
  Stack,
  Text,
  Center,
  Loader,
  Divider,
  Switch,
  Badge,
  ActionIcon,
  Box,
  Anchor,
  NativeSelect,
  Textarea,
  TextInput,
  Button,
} from '@mantine/core'
import { SaveIndicator } from '../../SaveIndicator'
import { detectPortalProvider } from '../../../../lib/detectPortalProvider'
import type { SaveStatus } from '../../SaveIndicator'

type Platform = 'ashby' | 'greenhouse' | 'lever'
type Method = 'auto' | 'websearch'

type CustomPortal = {
  id: string
  name: string
  url: string
  enabled: boolean
  provider: string | null
  api: string | null
  method: Method
  query: string | null
  notes: string | null
}

type EditFields = {
  method: Method
  query: string | null
  notes: string | null
}

type AddFields = {
  name: string
  url: string
  method: Method
  query: string | null
  notes: string | null
}

const PRESET_PLATFORMS: { id: Platform; label: string; tagline: string }[] = [
  { id: 'ashby', label: 'Ashby', tagline: 'AI/dev-tool startups' },
  { id: 'greenhouse', label: 'Greenhouse', tagline: 'Enterprise & growth-stage' },
  { id: 'lever', label: 'Lever', tagline: 'Series A–C startups' },
]

const PLATFORM_KEYS = new Set<string>(['ashby', 'greenhouse', 'lever'])

const LABEL_STYLES = {
  fontSize: '0.6875rem',
  fontWeight: 500 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: '#a1a1aa',
}

const METHOD_OPTIONS = [
  { value: 'auto', label: 'Auto (API detect)' },
  { value: 'websearch', label: 'Web search' },
]

function isValidHttpsUrl(url: string): boolean {
  if (!url.startsWith('https://')) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function resolveMethodBadge(portal: CustomPortal): { label: string; color: string } {
  if (portal.method === 'websearch') return { label: 'Search', color: 'blue' }
  const fromUrl = detectPortalProvider(portal.url)
  if (portal.provider || fromUrl !== 'Unknown') return { label: 'API', color: 'green' }
  return { label: 'Unknown', color: 'yellow' }
}

// ─── PresetRow ───────────────────────────────────────────────────────────────

function PresetRow({
  platform,
  enabled,
  onToggle,
}: {
  platform: (typeof PRESET_PLATFORMS)[number]
  enabled: boolean
  onToggle: (id: Platform, enabled: boolean) => void
}) {
  return (
    <Group gap={12} align="center" py={4} data-testid={`preset-${platform.id}`}>
      <Switch
        checked={enabled}
        onChange={(e) => onToggle(platform.id, e.currentTarget.checked)}
        size="xs"
        aria-label={enabled ? `Disable ${platform.label}` : `Enable ${platform.label}`}
        data-testid={`preset-${platform.id}-toggle`}
      />
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Group gap={6} align="center">
          <Text size="sm" fw={500}>
            {platform.label}
          </Text>
          <Text size="xs" c="dimmed">
            —
          </Text>
          <Text size="xs" c="dimmed">
            {platform.tagline}
          </Text>
        </Group>
      </Box>
      <Badge size="xs" variant="outline" color="gray" style={{ flexShrink: 0 }}>
        preset
      </Badge>
    </Group>
  )
}

// ─── CustomTargetRow ─────────────────────────────────────────────────────────

function CustomTargetRow({
  portal,
  onToggle,
  onDelete,
  onUpdate,
}: {
  portal: CustomPortal
  onToggle: (id: string, enabled: boolean) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, fields: EditFields) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [editMethod, setEditMethod] = useState<Method>(portal.method)
  const [editQuery, setEditQuery] = useState(portal.query ?? '')
  const [editNotes, setEditNotes] = useState(portal.notes ?? '')
  const [saving, setSaving] = useState(false)

  const badge = resolveMethodBadge(portal)

  async function handleSave() {
    setSaving(true)
    try {
      await onUpdate(portal.id, {
        method: editMethod,
        query: editMethod === 'websearch' ? editQuery.trim() || null : null,
        notes: editNotes.trim() || null,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setEditMethod(portal.method)
    setEditQuery(portal.query ?? '')
    setEditNotes(portal.notes ?? '')
    setEditing(false)
  }

  return (
    <Box
      component="li"
      style={{
        border: '1px solid var(--border-subtle, #3f3f46)',
        borderRadius: 6,
        padding: '8px 12px',
        listStyle: 'none',
      }}
    >
      <Group gap={12}>
        <Switch
          checked={portal.enabled}
          onChange={(e) => onToggle(portal.id, e.currentTarget.checked)}
          size="xs"
          aria-label={portal.enabled ? `Disable ${portal.name}` : `Enable ${portal.name}`}
        />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={500} truncate>
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
            <Text size="xs" c="dimmed" mt={2}>
              {portal.notes.length > 80 ? `${portal.notes.slice(0, 80)}…` : portal.notes}
            </Text>
          )}
          {portal.method === 'websearch' && portal.query && (
            <Text size="xs" c="dimmed" mt={2} fs="italic" truncate>
              {portal.query.length > 60 ? `${portal.query.slice(0, 60)}…` : portal.query}
            </Text>
          )}
        </Box>
        <Badge size="xs" variant="light" color={badge.color} style={{ flexShrink: 0 }}>
          {badge.label}
        </Badge>
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
        <Stack
          gap={8}
          mt={10}
          pt={10}
          style={{ borderTop: '1px solid var(--border-subtle, #3f3f46)' }}
        >
          <Group gap={8}>
            <NativeSelect
              label="Method"
              value={editMethod}
              onChange={(e) => setEditMethod(e.target.value as Method)}
              data={METHOD_OPTIONS}
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
          {editMethod === 'websearch' && (
            <Textarea
              label="Search query"
              value={editQuery}
              onChange={(e) => setEditQuery(e.target.value)}
              placeholder="site:lindy.ai jobs OR careers"
              maxLength={500}
              size="xs"
              rows={2}
            />
          )}
          <Group gap={8} justify="flex-end">
            <Button size="xs" variant="subtle" color="gray" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="xs" color="brand" onClick={handleSave} loading={saving}>
              Save
            </Button>
          </Group>
        </Stack>
      )}
    </Box>
  )
}

// ─── AddTargetForm ───────────────────────────────────────────────────────────

function AddTargetForm({ onAdd }: { onAdd: (fields: AddFields) => Promise<void> }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState<Method>('auto')
  const [query, setQuery] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Company name is required')
      return
    }
    if (!url.trim()) {
      setError('Careers URL is required')
      return
    }
    if (!isValidHttpsUrl(url.trim())) {
      setError('URL must be a valid https:// address')
      return
    }
    setSubmitting(true)
    try {
      await onAdd({
        name: name.trim(),
        url: url.trim(),
        method,
        query: method === 'websearch' ? query.trim() || null : null,
        notes: notes.trim() || null,
      })
      setName('')
      setUrl('')
      setMethod('auto')
      setQuery('')
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add target')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack
      component="form"
      gap={12}
      pt={12}
      style={{ borderTop: '1px solid var(--border)' }}
      onSubmit={handleSubmit}
    >
      <Group gap={12} grow>
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
      </Group>
      <Group gap={12} grow>
        <NativeSelect
          label="Method"
          value={method}
          onChange={(e) => setMethod(e.target.value as Method)}
          data={METHOD_OPTIONS}
          data-testid="method-select"
        />
        <TextInput
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Berlin DE — voice AI platform"
          maxLength={200}
        />
      </Group>
      {method === 'websearch' && (
        <Textarea
          label="Search query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="site:lindy.ai jobs OR careers"
          maxLength={500}
          rows={2}
        />
      )}
      {error && (
        <Text size="xs" c="#ef4444">
          {error}
        </Text>
      )}
      <Button type="submit" disabled={submitting} color="brand" size="xs">
        {submitting ? 'Adding…' : '+ Add target'}
      </Button>
    </Stack>
  )
}

// ─── TargetsTile ─────────────────────────────────────────────────────────────

export function TargetsTile() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [portals, setPortals] = useState<CustomPortal[]>([])
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let completed = 0
    const finish = () => {
      if (++completed === 2) setLoading(false)
    }

    fetch('/api/config/discovery')
      .then((r) => r.json())
      .then(({ data }) => {
        const raw = Array.isArray(data?.portals) ? (data.portals as string[]) : []
        setPlatforms(raw.filter((p): p is Platform => PLATFORM_KEYS.has(p)))
      })
      .catch(() => {})
      .finally(finish)

    fetch('/api/config/portals')
      .then((r) => r.json())
      .then(({ data }) => setPortals(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(finish)

    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  function markSaved() {
    setSaveStatus('saved')
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const handlePlatformToggle = useCallback(
    async (platform: Platform, enabled: boolean) => {
      const next = enabled
        ? [...platforms, platform]
        : platforms.filter((p) => p !== platform)
      setPlatforms(next)
      await fetch('/api/config/discovery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portals: next }),
      })
      markSaved()
    },
    [platforms],
  )

  const handleCustomToggle = useCallback(async (id: string, enabled: boolean) => {
    setPortals((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)))
    await fetch(`/api/config/portals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
  }, [])

  const handleCustomUpdate = useCallback(async (id: string, fields: EditFields) => {
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

  const handleCustomDelete = useCallback(async (id: string) => {
    setPortals((prev) => prev.filter((p) => p.id !== id))
    await fetch(`/api/config/portals/${id}`, { method: 'DELETE' })
  }, [])

  const handleAdd = useCallback(async (fields: AddFields) => {
    setSaveStatus('saving')
    const res = await fetch('/api/config/portals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    const { data, error } = (await res.json()) as { data?: CustomPortal; error?: string }
    if (!res.ok) {
      setSaveStatus('error')
      throw new Error(error ?? 'Failed to add target')
    }
    if (data) setPortals((prev) => [...prev, data])
    markSaved()
  }, [])

  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 7' }} className="bento-tile">
      <Group justify="space-between" mb="md">
        <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed">
          Targets
        </Text>
        <SaveIndicator status={saveStatus} />
      </Group>

      {loading ? (
        <Center h={80}>
          <Loader role="status" size="xs" color="var(--text-faint)" />
        </Center>
      ) : (
        <Stack gap={16}>
          <Stack gap={4}>
            <Text style={LABEL_STYLES}>Platforms</Text>
            <Stack gap={2}>
              {PRESET_PLATFORMS.map((platform) => (
                <PresetRow
                  key={platform.id}
                  platform={platform}
                  enabled={platforms.includes(platform.id)}
                  onToggle={handlePlatformToggle}
                />
              ))}
            </Stack>
          </Stack>

          <Divider label="Custom companies" labelPosition="left" />

          {portals.length === 0 ? (
            <Text size="xs" c="dimmed" fs="italic">
              No custom targets yet — add a company career page below.
            </Text>
          ) : (
            <Stack component="ul" gap={8} style={{ margin: 0, padding: 0 }}>
              {portals.map((portal) => (
                <CustomTargetRow
                  key={portal.id}
                  portal={portal}
                  onToggle={handleCustomToggle}
                  onDelete={handleCustomDelete}
                  onUpdate={handleCustomUpdate}
                />
              ))}
            </Stack>
          )}

          <AddTargetForm onAdd={handleAdd} />
        </Stack>
      )}
    </Paper>
  )
}
