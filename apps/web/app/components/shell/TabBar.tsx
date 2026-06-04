'use client'

import { useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Group } from '@mantine/core'

type Tab = 'config' | 'results'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'config', label: 'Config', icon: '⚙' },
  { id: 'results', label: 'Results', icon: '📊' },
]

export function TabBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = (searchParams.get('tab') as Tab | null) ?? 'results'
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  function setTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    let next: number | null = null
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length
    if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length
    if (next !== null) {
      e.preventDefault()
      setTab(TABS[next]!.id)
      tabRefs.current[next]?.focus()
    }
  }

  return (
    <Group role="tablist" aria-label="Main navigation" gap={2}>
      {TABS.map((tab, index) => (
        <button
          key={tab.id}
          id={`${tab.id}-tab`}
          role="tab"
          aria-selected={active === tab.id}
          aria-controls="main-tab-panel"
          tabIndex={active === tab.id ? 0 : -1}
          ref={(el) => { tabRefs.current[index] = el }}
          onClick={() => setTab(tab.id)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="tab-btn"
        >
          <span aria-hidden="true">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </Group>
  )
}

export type { Tab }
