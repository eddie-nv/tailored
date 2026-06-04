'use client'

import { useId, useRef, useState } from 'react'
import { Box, Flex, Textarea, ActionIcon, Text } from '@mantine/core'

type Props = {
  onSubmit: (text: string) => void
  isLoading: boolean
}

export function ChatInput({ onSubmit, isLoading }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hintId = useId()

  function handleSubmit() {
    const text = value.trim()
    if (!text || isLoading) return
    onSubmit(text)
    setValue('')
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Box
      pt={8}
      px={12}
      pb={12}
      style={{
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
      }}
    >
      <Flex
        align="flex-end"
        gap="xs"
        bd="1px solid var(--border)"
        bg="white"
        p="8px 8px 8px 12px"
        style={{
          borderRadius: 12,
          transition: 'border-color 0.15s',
        }}
      >
        <Textarea
          ref={textareaRef}
          variant="unstyled"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Tailored…"
          disabled={isLoading}
          aria-label="Message input"
          aria-describedby={hintId}
          autosize
          minRows={1}
          maxRows={6}
          style={{ flex: 1 }}
          styles={{
            input: {
              fontSize: '0.875rem',
              lineHeight: '1.25rem',
              color: 'var(--foreground)',
              padding: 0,
              minHeight: 'unset',
            },
          }}
        />
        <ActionIcon
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim()}
          loading={isLoading}
          aria-label="Send message"
          variant="filled"
          color="dark"
          size="md"
          radius="md"
          style={{ flexShrink: 0 }}
        >
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 10V2M6 2L2.5 5.5M6 2L9.5 5.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </ActionIcon>
      </Flex>
      <Text
        id={hintId}
        ta="center"
        mt={6}
        fz={10}
        c="var(--text-faint)"
      >
        Enter to send · Shift+Enter for newline
      </Text>
    </Box>
  )
}
