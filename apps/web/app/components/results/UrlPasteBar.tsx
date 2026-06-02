'use client'

import { useState, useRef, useImperativeHandle, type FormEvent } from 'react'

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
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-b border-zinc-800 flex-shrink-0">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste a job URL or description to evaluate…"
        disabled={isLoading}
        aria-label="Job URL or description"
        className="flex-1 bg-zinc-800 text-zinc-100 placeholder-zinc-500 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!value.trim() || isLoading}
        aria-label="Evaluate job"
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded transition-colors"
      >
        {isLoading ? 'Evaluating…' : 'Evaluate'}
      </button>
    </form>
  )
}
