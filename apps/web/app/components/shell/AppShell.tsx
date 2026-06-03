'use client'

import { useSearchParams } from 'next/navigation'
import { ChatPanel } from '../chat/ChatPanel'
import { TabBar } from './TabBar'
import type { Tab } from './TabBar'
import { ConfigTab } from '../tabs/ConfigTab'
import { ResultsTab } from '../tabs/ResultsTab'
import { ErrorBoundary } from './ErrorBoundary'

function TabContent({ tab }: { tab: Tab }) {
  if (tab === 'config') return <ConfigTab />
  return <ResultsTab />
}

export function AppShell() {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get('tab') as Tab | null) ?? 'results'

  return (
    <div className="flex h-full overflow-hidden bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-[var(--foreground)] focus:rounded-md focus:shadow-lg focus:ring-2 focus:ring-[var(--accent)] text-sm font-medium"
      >
        Skip to main content
      </a>

      {/* Chat panel — fixed left column */}
      <aside
        className="w-80 shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--surface)]"
        aria-label="Chat"
      >
        <div className="flex items-center gap-2 px-4 h-12 border-b border-[var(--border)] shrink-0">
          <h1 className="text-sm font-semibold tracking-tight text-[var(--foreground)] m-0">Tailored</h1>
          <span className="text-xs text-[var(--text-muted)] font-mono">AI</span>
        </div>
        <ErrorBoundary label="Chat panel error">
          <ChatPanel />
        </ErrorBoundary>
      </aside>

      {/* Main panel */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Tab bar */}
        <header className="flex items-center gap-2 px-4 h-12 border-b border-[var(--border)] shrink-0">
          <TabBar />
        </header>

        {/* Tab content */}
        <main id="main-content" className="flex-1 overflow-auto">
          <div
            id="main-tab-panel"
            role="tabpanel"
            aria-labelledby={`${activeTab}-tab`}
            tabIndex={-1}
          >
            <ErrorBoundary label={activeTab === 'config' ? 'Config tab error' : 'Results tab error'}>
              <TabContent tab={activeTab} />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}
