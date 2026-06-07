import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { CustomPortalList } from './CustomPortalList'

type Portal = {
  id: string
  name: string
  url: string
  enabled: boolean
  provider: string | null
  api: string | null
  notes: string | null
}

function makePortal(overrides: Partial<Portal> = {}): Portal {
  return {
    id: '1',
    name: 'Test Co',
    url: 'https://careers.test.com',
    enabled: true,
    provider: null,
    api: null,
    notes: null,
    ...overrides,
  }
}

function renderList(portals: Portal[], handlers = {}) {
  return render(
    <MantineProvider>
      <CustomPortalList
        portals={portals}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
        {...handlers}
      />
    </MantineProvider>,
  )
}

describe('CustomPortalList — provider badges', () => {
  it('shows provider name badge when provider is set', () => {
    renderList([makePortal({ provider: 'Greenhouse', url: 'https://careers.airbnb.com' })])
    expect(screen.getByText('Greenhouse')).toBeInTheDocument()
  })

  it('shows Unsupported badge when provider is null and URL unrecognised', () => {
    renderList([makePortal({ provider: null, url: 'https://careers.niche.com' })])
    expect(screen.getByText('Unsupported')).toBeInTheDocument()
  })

  it('shows detected provider badge when provider is null but URL is recognised', () => {
    renderList([makePortal({ provider: null, url: 'https://jobs.ashbyhq.com/linear' })])
    expect(screen.getByText('Ashby')).toBeInTheDocument()
    expect(screen.queryByText('Unsupported')).not.toBeInTheDocument()
  })

  it('shows override badge even when URL points to a different platform', () => {
    renderList([makePortal({ provider: 'Lever', url: 'https://jobs.ashbyhq.com/linear' })])
    expect(screen.getByText('Lever')).toBeInTheDocument()
  })
})

describe('CustomPortalList — notes', () => {
  it('renders notes text below company name when present', () => {
    renderList([makePortal({ notes: 'Berlin DE — voice AI platform' })])
    expect(screen.getByText('Berlin DE — voice AI platform')).toBeInTheDocument()
  })

  it('does not render notes section when notes is null', () => {
    renderList([makePortal({ notes: null })])
    expect(screen.queryByText('Berlin DE — voice AI platform')).not.toBeInTheDocument()
  })
})

describe('CustomPortalList — empty state', () => {
  it('shows empty state message when no portals', () => {
    renderList([])
    expect(screen.getByText(/no custom portals/i)).toBeInTheDocument()
  })
})
