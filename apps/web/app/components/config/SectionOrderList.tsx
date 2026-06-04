'use client'

import { useState, useCallback, useRef } from 'react'
import type { DragEvent } from 'react'
import { Stack, Text } from '@mantine/core'

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
  const liveRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      e.preventDefault()
      const next = e.key === 'ArrowUp' ? index - 1 : index + 1
      if (next < 0 || next >= sections.length) return
      const reordered = [...sections]
      const [item] = reordered.splice(index, 1)
      reordered.splice(next, 0, item)
      onChange(reordered)
      if (liveRef.current) {
        const label = SECTION_LABELS[item] ?? item
        liveRef.current.textContent = `${label} moved to position ${next + 1}`
      }
    },
    [sections, onChange],
  )

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
    <>
      <Stack gap={6} role="list" aria-label="Resume section order">
        {sections.map((section, index) => (
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <div
            key={section}
            role="listitem"
            tabIndex={0}
            aria-label={`${SECTION_LABELS[section] ?? section}, position ${index + 1} of ${sections.length}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="section-drag-item"
            data-dragging={dragIndex === index ? 'true' : undefined}
            data-over={overIndex === index ? 'true' : undefined}
          >
            <svg
              style={{ width: 14, height: 14, color: 'var(--text-subtle)', flexShrink: 0 }}
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
            <Text span c="#3f3f46">{SECTION_LABELS[section] ?? section}</Text>
            <Text component="span" fz={10} c="var(--text-subtle)" ff="monospace" ml="auto" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {index + 1}
            </Text>
          </div>
        ))}
      </Stack>
      <div ref={liveRef} role="status" aria-live="polite" className="sr-only" />
    </>
  )
}
