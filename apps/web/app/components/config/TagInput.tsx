'use client'

import { useState, useRef, useCallback, useId } from 'react'
import type { KeyboardEvent } from 'react'

type Props = {
  label: string
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  id?: string
}

export function TagInput({ label, value, onChange, placeholder = 'Type and press Enter', id }: Props) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const fieldId = id ?? `tag-${label.toLowerCase().replace(/\s+/g, '-')}`
  const descId = useId()

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim()
      if (!tag || value.includes(tag)) return
      onChange([...value, tag])
      setInput('')
    },
    [value, onChange],
  )

  const removeTag = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index))
    },
    [value, onChange],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault()
        addTag(input)
      } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
        onChange(value.slice(0, -1))
      }
    },
    [input, value, onChange, addTag],
  )

  return (
    <div>
      <label
        htmlFor={fieldId}
        className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-2"
      >
        {label}
      </label>
      <div
        className="flex flex-wrap gap-1.5 min-h-9 px-2 py-1.5 border border-[var(--border)] rounded-[var(--radius-sm)] bg-white cursor-text focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)] transition-colors"
        onClick={() => inputRef.current?.focus()}
        role="presentation"
      >
        {value.map((tag, i) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(i)
              }}
              aria-label={`Remove ${tag}`}
              className="text-zinc-400 hover:text-zinc-700 transition-colors leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <span id={descId} className="sr-only">
          Type a tag and press Enter, comma, or space to add it.
        </span>
        <input
          ref={inputRef}
          id={fieldId}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (input.trim()) addTag(input)
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          aria-describedby={descId}
          className="flex-1 min-w-28 text-sm outline-none bg-transparent text-zinc-900 placeholder:text-zinc-300"
        />
      </div>
    </div>
  )
}
