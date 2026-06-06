'use client'

import { createContext, useContext, useState } from 'react'

type RoleTargetsContextValue = {
  derivedTitles: string[]
  setDerivedTitles: (titles: string[]) => void
}

const RoleTargetsContext = createContext<RoleTargetsContextValue | null>(null)

type Props = {
  children: React.ReactNode
  initialDerived?: string[]
}

export function RoleTargetsProvider({ children, initialDerived = [] }: Props) {
  const [derivedTitles, setDerivedTitles] = useState<string[]>(initialDerived)
  return (
    <RoleTargetsContext.Provider value={{ derivedTitles, setDerivedTitles }}>
      {children}
    </RoleTargetsContext.Provider>
  )
}

export function useRoleDerivedTitles(): RoleTargetsContextValue {
  const ctx = useContext(RoleTargetsContext)
  if (!ctx) throw new Error('useRoleDerivedTitles must be used within RoleTargetsProvider')
  return ctx
}
