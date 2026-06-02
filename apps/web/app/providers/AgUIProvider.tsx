'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { HttpAgent } from '@ag-ui/client'

interface AgUIContextValue {
  agent: HttpAgent
  threadId: string
}

const AgUIContext = createContext<AgUIContextValue | null>(null)

function getOrCreateThreadId(): string {
  const key = 'tailored:threadId'
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(key, id)
  return id
}

interface AgUIProviderProps {
  url: string
  children: ReactNode
}

export function AgUIProvider({ url, children }: AgUIProviderProps) {
  // useMemo so the agent is created once per url, not on every render.
  // The typeof window guard keeps SSR (pre-hydration) from accessing localStorage.
  const ctx = useMemo<AgUIContextValue | null>(() => {
    if (typeof window === 'undefined') return null
    const threadId = getOrCreateThreadId()
    return { agent: new HttpAgent({ url, threadId }), threadId }
  }, [url])

  return <AgUIContext.Provider value={ctx}>{children}</AgUIContext.Provider>
}

export function useAgUI(): AgUIContextValue {
  const ctx = useContext(AgUIContext)
  if (!ctx) throw new Error('useAgUI must be used inside AgUIProvider')
  return ctx
}
