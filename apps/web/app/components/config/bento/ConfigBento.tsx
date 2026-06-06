'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs } from '@mantine/core'
import { User, MagnifyingGlass, FilePdf } from '@phosphor-icons/react'
import { RoleTargetsProvider } from '../../../providers/RoleTargetsProvider'
import { IdentityTile } from './tiles/IdentityTile'
import { NarrativeTile } from './tiles/NarrativeTile'
import { TargetRolesTile } from './tiles/TargetRolesTile'
import { CompensationTile } from './tiles/CompensationTile'
import { WorkPrefsTile } from './tiles/WorkPrefsTile'
import { CvOutputTile } from './tiles/CvOutputTile'
import { DiscoveryTile } from './tiles/DiscoveryTile'
import { SearchFiltersTile } from './tiles/SearchFiltersTile'
import { LocationFilterTile } from './tiles/LocationFilterTile'
import { ProofPointsTile } from './tiles/ProofPointsTile'
import { PdfGateTile } from './tiles/PdfGateTile'

type Section = 'profile' | 'scanner' | 'cv'

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <User size={16} /> },
  { id: 'scanner', label: 'Scanner', icon: <MagnifyingGlass size={16} /> },
  { id: 'cv', label: 'CV', icon: <FilePdf size={16} /> },
]

export function ConfigBento() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeSection = (searchParams.get('section') as Section | null) ?? 'profile'

  function handleTabChange(value: string | null) {
    if (!value) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('section', value)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <RoleTargetsProvider>
      <Tabs value={activeSection} onChange={handleTabChange} variant="pills" keepMounted={false}>
        <Tabs.List mb="xl">
          {SECTIONS.map(({ id, label, icon }) => (
            <Tabs.Tab key={id} value={id} leftSection={icon}>
              {label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel value="profile">
          <div className="bento-grid">
            <IdentityTile />
            <NarrativeTile />
            <TargetRolesTile />
            <CompensationTile />
            <WorkPrefsTile />
            <ProofPointsTile />
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="scanner">
          <div className="bento-grid">
            <DiscoveryTile />
            <SearchFiltersTile />
            <LocationFilterTile />
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="cv">
          <div className="bento-grid">
            <CvOutputTile />
            <PdfGateTile />
          </div>
        </Tabs.Panel>
      </Tabs>
    </RoleTargetsProvider>
  )
}
