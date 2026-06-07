'use client'

import { Badge } from '@mantine/core'

type Props = {
  source: string
}

export function JobSourceBadge({ source }: Props) {
  if (source === 'scan') {
    return (
      <Badge
        size="xs"
        fw={600}
        style={{
          background: 'rgba(16, 185, 129, 0.1)',
          color: '#059669',
          fontSize: '0.625rem',
        }}
      >
        API
      </Badge>
    )
  }

  if (source === 'search') {
    return (
      <Badge
        size="xs"
        fw={600}
        style={{
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#2563eb',
          fontSize: '0.625rem',
        }}
      >
        Web
      </Badge>
    )
  }

  return null
}
