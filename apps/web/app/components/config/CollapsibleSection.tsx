'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { SaveIndicator } from './SaveIndicator'
import type { SaveStatus } from './SaveIndicator'

type Props = {
  title: string
  saveStatus?: SaveStatus
  defaultOpen?: boolean
  children: ReactNode
}

export function CollapsibleSection({
  title,
  saveStatus = 'idle',
  defaultOpen = true,
  children,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="border-b border-[var(--border)] last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-[var(--surface)] transition-colors"
      >
        <span className="text-sm font-semibold text-zinc-900 tracking-tight">{title}</span>
        <div className="flex items-center gap-3">
          <SaveIndicator status={saveStatus} />
          <svg
            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div
        style={{
          overflow: 'hidden',
          maxHeight: isOpen ? '4000px' : '0',
          transition: 'max-height 0.25s ease',
        }}
      >
        <div className="px-6 pb-6 pt-1">{children}</div>
      </div>
    </section>
  )
}
