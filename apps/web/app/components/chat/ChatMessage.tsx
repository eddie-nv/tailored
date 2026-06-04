import { Box, Flex, Paper, Text, Group, Center } from '@mantine/core'
import type { UIMessage } from './ChatPanel'

type Props = {
  message: UIMessage
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <Flex justify="flex-end">
        <Paper
          shadow="none"
          maw="85%"
          p="8px 12px"
          bg="var(--foreground)"
          c="white"
          fz="sm"
          lh={1.5}
          style={{
            borderRadius: '18px 18px 4px 18px',
            wordBreak: 'break-word',
          }}
        >
          {message.content}
        </Paper>
      </Flex>
    )
  }

  return (
    <Flex gap="xs" align="flex-start">
      {/* Avatar */}
      <Center
        w={24}
        h={24}
        bg="var(--surface-sunken)"
        bd="1px solid var(--border-subtle)"
        style={{ borderRadius: '50%', flexShrink: 0, marginTop: 2 }}
        aria-hidden="true"
      >
        <Text fw={600} fz={10} c="var(--text-muted)">T</Text>
      </Center>

      <Box style={{ flex: 1, minWidth: 0 }}>
        {/* Step indicator */}
        {message.activeStep && (
          <Group gap={6} mb={6}>
            <Box
              w={6}
              h={6}
              bg="#3b82f6"
              style={{ borderRadius: '50%', animation: 'pulse 2s ease-in-out infinite', flexShrink: 0 }}
              aria-hidden="true"
            />
            <Text size="xs" ff="monospace" c="dimmed">{message.activeStep}</Text>
          </Group>
        )}

        {/* Content */}
        <Paper
          shadow="none"
          withBorder
          p="xs"
          fz="sm"
          lh={1.5}
          style={{
            color: message.isError ? '#dc2626' : 'var(--foreground)',
            wordBreak: 'break-word',
            minHeight: message.isStreaming && !message.content ? '1.25rem' : undefined,
            borderColor: 'var(--border)',
          }}
        >
          {message.content ? (
            <span className={message.isStreaming ? 'streaming-cursor' : ''}>
              {message.content}
            </span>
          ) : message.isStreaming ? (
            <Group gap={2} align="center" style={{ height: 16 }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  w={4}
                  h={4}
                  bg="var(--text-faint)"
                  style={{ borderRadius: '50%', animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
                  aria-hidden="true"
                />
              ))}
            </Group>
          ) : null}
        </Paper>
      </Box>
    </Flex>
  )
}
