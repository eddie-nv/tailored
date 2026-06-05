'use client'

import { Paper, Group, Text, SimpleGrid, TextInput, Center, Loader } from '@mantine/core'
import { useProfileField } from '../../../../hooks/useProfileField'
import { SaveIndicator } from '../../SaveIndicator'

type IdentityForm = {
  fullName: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  portfolioUrl: string
  twitter: string
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function parse(data: Record<string, unknown> | null): IdentityForm {
  if (!data) return { fullName: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolioUrl: '', twitter: '' }
  return {
    fullName: str(data.fullName),
    email: str(data.email),
    phone: str(data.phone),
    location: str(data.location),
    linkedin: str(data.linkedin),
    github: str(data.github),
    portfolioUrl: str(data.portfolioUrl),
    twitter: str(data.twitter),
  }
}

function serialize(form: IdentityForm): Record<string, unknown> {
  return {
    fullName: form.fullName || null,
    email: form.email || null,
    phone: form.phone || null,
    location: form.location || null,
    linkedin: form.linkedin || null,
    github: form.github || null,
    portfolioUrl: form.portfolioUrl || null,
    twitter: form.twitter || null,
  }
}

const labelStyle = {
  fontSize: '0.6875rem',
  fontWeight: 500 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: '#a1a1aa',
  marginBottom: 8,
}

export function IdentityTile() {
  const { form, handleChange, saveStatus } = useProfileField(parse, serialize)

  return (
    <Paper withBorder p="lg" style={{ gridColumn: 'span 4' }} className="bento-tile">
      <Group justify="space-between" mb="md">
        <Text size="xs" fw={500} tt="uppercase" lts="0.1em" c="dimmed">
          Identity
        </Text>
        <SaveIndicator status={saveStatus} />
      </Group>

      {!form ? (
        <Center h={120}>
          <Loader size="sm" color="var(--text-faint)" />
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={12}>
          <TextInput
            label="Full Name"
            value={form.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="Jane Smith"
            styles={{ label: labelStyle }}
          />
          <TextInput
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="jane@example.com"
            styles={{ label: labelStyle }}
          />
          <TextInput
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+1 555 000 0000"
            styles={{ label: labelStyle }}
          />
          <TextInput
            label="Location"
            value={form.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="San Francisco, CA"
            styles={{ label: labelStyle }}
          />
          <TextInput
            label="LinkedIn"
            value={form.linkedin}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            placeholder="linkedin.com/in/janesmith"
            leftSection={<Text size="xs" c="dimmed">in/</Text>}
            styles={{ label: labelStyle }}
          />
          <TextInput
            label="GitHub"
            value={form.github}
            onChange={(e) => handleChange('github', e.target.value)}
            placeholder="github.com/janesmith"
            leftSection={<Text size="xs" c="dimmed">@</Text>}
            styles={{ label: labelStyle }}
          />
          <TextInput
            label="Portfolio"
            value={form.portfolioUrl}
            onChange={(e) => handleChange('portfolioUrl', e.target.value)}
            placeholder="janesmith.dev"
            styles={{ label: labelStyle }}
          />
          <TextInput
            label="Twitter / X"
            value={form.twitter}
            onChange={(e) => handleChange('twitter', e.target.value)}
            placeholder="@janesmith"
            leftSection={<Text size="xs" c="dimmed">@</Text>}
            styles={{ label: labelStyle }}
          />
        </SimpleGrid>
      )}
    </Paper>
  )
}
