'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Accordion } from '@mantine/core'
import { User, MagnifyingGlass, FilePdf } from '@phosphor-icons/react'
import { RoleTargetsProvider } from '../../../providers/RoleTargetsProvider'
import { IdentityTile } from './tiles/IdentityTile'
import { NarrativeTile } from './tiles/NarrativeTile'
import { TargetRolesTile } from './tiles/TargetRolesTile'
import { CompensationTile } from './tiles/CompensationTile'
import { WorkPrefsTile } from './tiles/WorkPrefsTile'
import { CvOutputTile } from './tiles/CvOutputTile'
import { BroadDiscoveryTile } from './tiles/BroadDiscoveryTile'
import { CompanyWatchlistTile } from './tiles/CompanyWatchlistTile'
import { DiscoveryQueriesTile } from './tiles/DiscoveryQueriesTile'
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

function parseOpen(raw: string | null): Section[] {
  if (!raw) return ['profile']
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is Section => ['profile', 'scanner', 'cv'].includes(s))
}

export function ConfigBento() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [openSections, setOpenSections] = useState<Section[]>(() =>
    parseOpen(searchParams.get('open')),
  )

  function handleChange(values: string[]) {
    const next = values.filter((v): v is Section =>
      ['profile', 'scanner', 'cv'].includes(v),
    )
    setOpenSections(next)
    const params = new URLSearchParams(searchParams.toString())
    if (next.length === 0) {
      params.delete('open')
    } else {
      params.set('open', next.join(','))
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <RoleTargetsProvider>
      <Accordion multiple value={openSections} onChange={handleChange}>
        {SECTIONS.map(({ id, label, icon }) => {
          const isOpen = openSections.includes(id)
          return (
            <Accordion.Item key={id} value={id}>
              <Accordion.Control icon={icon}>{label}</Accordion.Control>
              <Accordion.Panel>
                {isOpen && (
                  <div className="bento-grid">
                    {id === 'profile' && (
                      <>
                        <IdentityTile />
                        <NarrativeTile />
                        <TargetRolesTile />
                        <CompensationTile />
                        <WorkPrefsTile />
                        <ProofPointsTile />
                      </>
                    )}
                    {id === 'scanner' && (
                      <>
                        <BroadDiscoveryTile />
                        <SearchFiltersTile />
                        <CompanyWatchlistTile />
                        <LocationFilterTile />
                        <DiscoveryQueriesTile />
                      </>
                    )}
                    {id === 'cv' && (
                      <>
                        <CvOutputTile />
                        <PdfGateTile />
                      </>
                    )}
                  </div>
                )}
              </Accordion.Panel>
            </Accordion.Item>
          )
        })}
      </Accordion>
    </RoleTargetsProvider>
  )
}
