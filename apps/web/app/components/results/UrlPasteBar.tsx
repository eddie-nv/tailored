'use client'

import { useState, useRef, useImperativeHandle, type FormEvent } from 'react'
import { Button, Group, TextInput } from '@mantine/core'

export interface UrlPasteBarHandle {
  focus: () => void
}

interface UrlPasteBarProps {
  onSubmit: (input: string) => void
  isLoading: boolean
  ref?: React.Ref<UrlPasteBarHandle>
}

export function UrlPasteBar({ onSubmit, isLoading, ref }: UrlPasteBarProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSubmit(trimmed)
    setValue('')
  }

  return (
    <Group
      component="form"
      gap={8}
      p={12}
      onSubmit={handleSubmit}
      style={{ borderBottom: '1px solid var(--border-divider)', flexShrink: 0 }}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste a job URL or description to evaluate…"
        disabled={isLoading}
        aria-label="Job URL or description"
        style={{ flex: 1 }}
        size="sm"
      />
      <Button
        type="submit"
        disabled={!value.trim() || isLoading}
        color="brand"
        size="sm"
      >
        {isLoading ? 'Evaluating…' : 'Evaluate'}
      </Button>
    </Group>
  )
}
