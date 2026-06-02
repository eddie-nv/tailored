'use client'

import { useSearchParams } from 'next/navigation'
import { ChatPanel } from '../chat/ChatPanel'
import { TabBar } from './TabBar'
import type { Tab } from './TabBar'
import { ConfigTab } from '../tabs/ConfigTab'
import { ResultsTab } from '../tabs/ResultsTab'

function TabContent({ tab }: { tab: Tab }) {
  if (tab === 'config') return <ConfigTab />
  return <ResultsTab />
}

export function AppShell() {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get('tab') as Tab | null) ?? 'results'

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Chat panel — fixed left column */}
      <aside
        className="w-80 shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--surface)]"
        aria-label="Chat"
      >
        <div className="flex items-center gap-2 px-4 h-12 border-b border-[var(--border)] shrink-0">
          <span className="text-sm font-semibold tracking-tight text-zinc-900">Tailored</span>
          <span className="text-xs text-zinc-400 font-mono">AI</span>
        </div>
        <ChatPanel />
      </aside>

      {/* Main panel */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Tab bar */}
        <header className="flex items-center gap-2 px-4 h-12 border-b border-[var(--border)] shrink-0">
          <TabBar />
        </header>

        {/* Tab content */}
        <main
          role="tabpanel"
          aria-label={activeTab === 'config' ? 'Config' : 'Results'}
          className="flex-1 overflow-auto"
        >
          <TabContent tab={activeTab} />
        </main>
      </div>
    </div>
  )
}
