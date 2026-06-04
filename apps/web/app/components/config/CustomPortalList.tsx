'use client'

import { Stack, Paper, Group, Box, Text, Anchor, Badge, ActionIcon, Switch } from '@mantine/core'
import { detectPortalProvider } from '../../lib/detectPortalProvider'

type CustomPortal = {
  id: string
  name: string
  url: string
  enabled: boolean
}

type Props = {
  portals: CustomPortal[]
  onToggle: (id: string, enabled: boolean) => void
  onDelete: (id: string) => void
}

export function CustomPortalList({ portals, onToggle, onDelete }: Props) {
  if (portals.length === 0) {
    return (
      <Text size="xs" c="#a1a1aa" fs="italic">
        No custom portals yet — add a company career page below.
      </Text>
    )
  }

  return (
    <Stack component="ul" gap={8} style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {portals.map((portal) => {
        const provider = detectPortalProvider(portal.url)
        return (
          <Paper component="li" key={portal.id} className="portal-item" withBorder p="8px 12px" bg="white" radius="sm">
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
                <Anchor href={portal.url} target="_blank" rel="noopener noreferrer" size="xs" c="dimmed" truncate display="block">
                  {portal.url}
                </Anchor>
              </Box>

              {provider !== 'Unknown' && (
                <Badge size="xs" fw={600} style={{ flexShrink: 0, background: 'rgba(255, 56, 92, 0.1)', color: 'var(--accent)', fontSize: '0.625rem' }}>
                  {provider}
                </Badge>
              )}

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
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </ActionIcon>
            </Group>
          </Paper>
        )
      })}
    </Stack>
  )
}
