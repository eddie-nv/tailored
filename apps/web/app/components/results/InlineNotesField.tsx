'use client'

import { memo, useState, useCallback, useRef, useEffect, useId } from 'react'
import { Group, Text, Textarea } from '@mantine/core'

interface InlineNotesFieldProps {
  jobId: string
  notes: string | null
  onUpdate: (jobId: string, notes: string) => Promise<void>
}

export const InlineNotesField = memo(function InlineNotesField({
  jobId,
  notes,
  onUpdate,
}: InlineNotesFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localNotes, setLocalNotes] = useState(notes ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hintId = useId()
  const modeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isEditing) setLocalNotes(notes ?? '')
  }, [notes, isEditing])

  const enterEdit = useCallback(() => {
    setIsEditing(true)
    if (modeRef.current) modeRef.current.textContent = 'Notes editing mode'
  }, [])

  const save = useCallback(async () => {
    setIsEditing(false)
    const trimmed = localNotes.trim()
    const prev = notes ?? ''
    if (trimmed === prev) return
    setIsSaving(true)
    try {
      await onUpdate(jobId, trimmed)
    } catch {
      setLocalNotes(prev)
    } finally {
      setIsSaving(false)
    }
  }, [jobId, localNotes, notes, onUpdate])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        setLocalNotes(notes ?? '')
        setIsEditing(false)
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        void save()
      }
    },
    [notes, save],
  )

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [isEditing])

  return (
    <Group align="flex-start" gap={8} style={{ flex: 1, minWidth: 0 }}>
      <div ref={modeRef} role="status" aria-live="polite" className="sr-only" />
      <Text component="span" size="xs" c="var(--text-faint)" fw={500} aria-hidden="true" style={{ flexShrink: 0, marginTop: 4 }}>
        Notes
      </Text>
      {isEditing ? (
        <>
          <span id={hintId} className="sr-only">Press Ctrl+Enter to save, Escape to cancel.</span>
          <Textarea
            ref={textareaRef}
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={() => void save()}
            onKeyDown={handleKeyDown}
            placeholder="Add notes…"
            aria-label="Job notes"
            aria-describedby={hintId}
            autosize
            minRows={2}
            styles={{
              input: {
                resize: 'none',
                padding: '6px 10px',
                fontSize: '0.75rem',
                lineHeight: 1.5,
              },
              root: {
                flex: 1,
                minWidth: 0,
              },
            }}
          />
        </>
      ) : (
        <button
          type="button"
          onClick={enterEdit}
          disabled={isSaving}
          aria-label="Edit notes"
          className="notes-view-btn"
        >
          {isSaving ? (
            <Text component="span" c="var(--text-faint)" fs="italic">Saving…</Text>
          ) : localNotes ? (
            <Text component="span" c="var(--text-secondary)" style={{ whiteSpace: 'pre-wrap' }}>{localNotes}</Text>
          ) : (
            <Text component="span" c="var(--text-faint)" fs="italic">Click to add notes…</Text>
          )}
        </button>
      )}
    </Group>
  )
})
