'use client'

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

  function setTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div role="tablist" aria-label="Main navigation" className="flex items-center gap-0.5">
      {TABS.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => setTab(tab.id)}
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
