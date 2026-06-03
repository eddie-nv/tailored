'use client'

import { useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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
    <div role="tablist" aria-label="Main navigation" className="flex items-center gap-0.5">
      {TABS.map((tab, index) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            id={`${tab.id}-tab`}
            role="tab"
            aria-selected={isActive}
            aria-controls="main-tab-panel"
            tabIndex={isActive ? 0 : -1}
            ref={(el) => { tabRefs.current[index] = el }}
            onClick={() => setTab(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100',
            ].join(' ')}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export type { Tab }
