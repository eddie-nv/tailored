'use client'

import { useSearchParams } from 'next/navigation'
import { AppShell as MantineAppShell, Box, Text, Group } from '@mantine/core'
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
    <MantineAppShell
      navbar={{ width: 320, breakpoint: 'sm' }}
      withBorder={false}
      style={{ height: '100vh' }}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <MantineAppShell.Navbar
        bg='var(--surface)'
        component="aside"
        aria-label="Chat"
        style={{
          borderRight: '1px solid var(--border)',
        }}
      >
        <Group px="md" h='48' gap='5'>
          <Text
            size="sm"
            lts='-0.01em'
            c='var(--foreground)'
            fw={600}
          >
            Tailored
          </Text>
          <Text size="xs" ff="monospace" c="dimmed">AI</Text>
        </Group>
        <ErrorBoundary label="Chat panel error">
          <ChatPanel />
        </ErrorBoundary>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <Group component="header" align='center' gap='8' px='16px'>
          <TabBar />
        </Group>
        <Box
          component="main"
          flex={1}
          mih={0}
          style={{ overflowY: 'auto' }}
        >
          <div
            role="tabpanel"
            aria-labelledby={`${activeTab}-tab`}
            tabIndex={-1}
          >
            <ErrorBoundary label={activeTab === 'config' ? 'Config tab error' : 'Results tab error'}>
              <TabContent tab={activeTab} />
            </ErrorBoundary>
          </div>
        </Box>
      </MantineAppShell.Main>
    </MantineAppShell>
  )
}
