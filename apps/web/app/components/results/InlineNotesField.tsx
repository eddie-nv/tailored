'use client'

import { memo, useState, useCallback, useRef, useEffect, useId } from 'react'

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
    if (!isEditing) {
      setLocalNotes(notes ?? '')
    }
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
    <div className="flex items-start gap-2 flex-1 min-w-0">
      <div ref={modeRef} role="status" aria-live="polite" className="sr-only" />
      <span className="text-xs text-[var(--text-faint)] font-medium shrink-0 mt-1" aria-hidden="true">Notes</span>
      {isEditing ? (
        <>
          <span id={hintId} className="sr-only">
            Press Ctrl+Enter to save, Escape to cancel.
          </span>
          <textarea
            ref={textareaRef}
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={() => void save()}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Add notes…"
            aria-label="Job notes"
            aria-describedby={hintId}
            className="
              flex-1 min-w-0 resize-none rounded border border-[var(--text-faint)]
              bg-white px-2.5 py-1.5 text-xs text-[var(--foreground)]
              placeholder:text-[var(--text-faint)] leading-relaxed
              focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/60 focus:border-[var(--accent)]/60
              transition-colors
            "
          />
        </>
      ) : (
        <button
          type="button"
          onClick={enterEdit}
          disabled={isSaving}
          aria-label="Edit notes"
          className="
            flex-1 min-w-0 text-left rounded px-2.5 py-1.5 text-xs leading-relaxed
            text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] focus:outline-none
            focus:ring-1 focus:ring-[var(--accent)]/60
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors cursor-text
          "
        >
          {isSaving ? (
            <span className="text-[var(--text-faint)] italic">Saving…</span>
          ) : localNotes ? (
            <span className="text-[var(--text-secondary)] whitespace-pre-wrap">{localNotes}</span>
          ) : (
            <span className="text-[var(--text-faint)] italic">Click to add notes…</span>
          )}
        </button>
      )}
    </div>
  )
})
