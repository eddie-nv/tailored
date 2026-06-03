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

  // Sync prop to local state when parent updates (e.g. optimistic rollback)
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

  // Focus textarea when entering edit mode
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
      <span className="text-xs text-zinc-500 font-medium shrink-0 mt-1" aria-hidden="true">Notes</span>
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
            flex-1 min-w-0 resize-none rounded border border-zinc-600
            bg-zinc-800/80 px-2.5 py-1.5 text-xs text-zinc-200
            placeholder:text-zinc-600 leading-relaxed
            focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/60
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
            text-zinc-300 hover:bg-zinc-800/60 focus:outline-none
            focus:ring-1 focus:ring-indigo-500/60
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors cursor-text
          "
        >
          {isSaving ? (
            <span className="text-zinc-500 italic">Saving…</span>
          ) : localNotes ? (
            <span className="text-zinc-300 whitespace-pre-wrap">{localNotes}</span>
          ) : (
            <span className="text-zinc-600 italic">Click to add notes…</span>
          )}
        </button>
      )}
    </div>
  )
})
