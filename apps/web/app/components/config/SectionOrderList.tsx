'use client'

import { useState, useCallback, useRef } from 'react'
import type { DragEvent } from 'react'

type Props = {
  sections: string[]
  onChange: (sections: string[]) => void
}

const SECTION_LABELS: Record<string, string> = {
  summary: 'Summary',
  experience: 'Experience',
  skills: 'Skills',
  education: 'Education',
  projects: 'Projects',
  certifications: 'Certifications',
  achievements: 'Achievements',
  volunteering: 'Volunteering',
}

export function SectionOrderList({ sections, onChange }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const dragItem = useRef<number | null>(null)

  const handleDragStart = useCallback((_e: DragEvent, index: number) => {
    dragItem.current = index
    setDragIndex(index)
  }, [])

  const handleDragOver = useCallback((e: DragEvent, index: number) => {
    e.preventDefault()
    setOverIndex(index)
  }, [])

  const handleDrop = useCallback(
    (index: number) => {
      const from = dragItem.current
      if (from === null || from === index) {
        setDragIndex(null)
        setOverIndex(null)
        return
      }

      const reordered = [...sections]
      const [item] = reordered.splice(from, 1)
      reordered.splice(index, 0, item)
      onChange(reordered)

      dragItem.current = null
      setDragIndex(null)
      setOverIndex(null)
    },
    [sections, onChange],
  )

  const handleDragEnd = useCallback(() => {
    dragItem.current = null
    setDragIndex(null)
    setOverIndex(null)
  }, [])

  return (
    <div className="space-y-1.5" role="list" aria-label="Resume section order">
      {sections.map((section, index) => (
        <div
          key={section}
          role="listitem"
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={() => handleDrop(index)}
          onDragEnd={handleDragEnd}
          className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] border text-sm cursor-grab select-none transition-all ${
            dragIndex === index
              ? 'opacity-40 border-[var(--border)]'
              : overIndex === index
                ? 'border-[var(--accent)] bg-blue-50'
                : 'border-[var(--border)] bg-white hover:border-zinc-300'
          }`}
        >
          <svg
            className="w-3.5 h-3.5 text-zinc-300 shrink-0"
            fill="currentColor"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <circle cx="4" cy="4" r="1.2" />
            <circle cx="4" cy="8" r="1.2" />
            <circle cx="4" cy="12" r="1.2" />
            <circle cx="9" cy="4" r="1.2" />
            <circle cx="9" cy="8" r="1.2" />
            <circle cx="9" cy="12" r="1.2" />
          </svg>
          <span className="text-zinc-700">{SECTION_LABELS[section] ?? section}</span>
          <span className="ml-auto text-[10px] text-zinc-300 font-mono tabular-nums">
            {index + 1}
          </span>
        </div>
      ))}
    </div>
  )
}
