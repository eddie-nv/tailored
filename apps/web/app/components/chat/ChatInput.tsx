'use client'

import { useId, useRef, useState } from 'react'

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
    <div className="shrink-0 px-3 pb-3 pt-2 border-t border-[var(--border)]">
      <div
        className={[
          'flex items-end gap-2 rounded-xl border bg-white px-3 py-2 transition-colors',
          isLoading
            ? 'border-[var(--border)]'
            : 'border-[var(--border)] focus-within:border-[var(--text-muted)]',
        ].join(' ')}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Tailored…"
          rows={1}
          disabled={isLoading}
          aria-label="Message input"
          aria-describedby={hintId}
          className={[
            'flex-1 resize-none bg-transparent text-sm leading-5 text-[var(--foreground)] placeholder:text-[var(--text-faint)]',
            'focus:outline-none disabled:opacity-50',
            'max-h-32 overflow-y-auto',
          ].join(' ')}
          style={{ minHeight: '20px' }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          aria-label="Send message"
          className={[
            'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
            value.trim() && !isLoading
              ? 'bg-[var(--foreground)] text-white hover:bg-[var(--text-secondary)]'
              : 'bg-[var(--surface-disabled)] text-[var(--text-faint)] cursor-not-allowed',
          ].join(' ')}
        >
          {isLoading ? (
            <span className="w-3 h-3 border-2 border-[var(--text-faint)] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          ) : (
            <svg
              aria-hidden="true"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M6 10V2M6 2L2.5 5.5M6 2L9.5 5.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
      <p id={hintId} className="text-[10px] text-[var(--text-faint)] text-center mt-1.5">
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  )
}
