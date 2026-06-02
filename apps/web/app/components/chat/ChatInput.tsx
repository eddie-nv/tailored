'use client'

import { useRef, useState } from 'react'

type Props = {
  onSubmit: (text: string) => void
  isLoading: boolean
}

export function ChatInput({ onSubmit, isLoading }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
          isLoading ? 'border-zinc-200' : 'border-zinc-300 focus-within:border-zinc-500',
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
          className={[
            'flex-1 resize-none bg-transparent text-sm leading-5 text-zinc-900 placeholder:text-zinc-400',
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
              ? 'bg-zinc-900 text-white hover:bg-zinc-700'
              : 'bg-zinc-200 text-zinc-400 cursor-not-allowed',
          ].join(' ')}
        >
          {isLoading ? (
            <span className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
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
      <p className="text-[10px] text-zinc-400 text-center mt-1.5">
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  )
}
