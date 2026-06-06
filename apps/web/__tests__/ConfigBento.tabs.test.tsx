import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'

// --- next/navigation mock ---
const mockPush = vi.fn()
const mockSearchParams = { get: vi.fn() }

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}))

// --- Tile mocks — each renders a unique testid so we can assert presence ---
vi.mock('../app/components/config/bento/tiles/IdentityTile', () => ({
  IdentityTile: () => <div data-testid="tile-identity" />,
}))
vi.mock('../app/components/config/bento/tiles/NarrativeTile', () => ({
  NarrativeTile: () => <div data-testid="tile-narrative" />,
}))
vi.mock('../app/components/config/bento/tiles/TargetRolesTile', () => ({
  TargetRolesTile: () => <div data-testid="tile-target-roles" />,
}))
vi.mock('../app/components/config/bento/tiles/CompensationTile', () => ({
  CompensationTile: () => <div data-testid="tile-compensation" />,
}))
vi.mock('../app/components/config/bento/tiles/WorkPrefsTile', () => ({
  WorkPrefsTile: () => <div data-testid="tile-work-prefs" />,
}))
vi.mock('../app/components/config/bento/tiles/ProofPointsTile', () => ({
  ProofPointsTile: () => <div data-testid="tile-proof-points" />,
}))
vi.mock('../app/components/config/bento/tiles/DiscoveryTile', () => ({
  DiscoveryTile: () => <div data-testid="tile-discovery" />,
}))
vi.mock('../app/components/config/bento/tiles/SearchFiltersTile', () => ({
  SearchFiltersTile: () => <div data-testid="tile-search-filters" />,
}))
vi.mock('../app/components/config/bento/tiles/LocationFilterTile', () => ({
  LocationFilterTile: () => <div data-testid="tile-location-filter" />,
}))
vi.mock('../app/components/config/bento/tiles/CvOutputTile', () => ({
  CvOutputTile: () => <div data-testid="tile-cv-output" />,
}))
vi.mock('../app/components/config/bento/tiles/PdfGateTile', () => ({
  PdfGateTile: () => <div data-testid="tile-pdf-gate" />,
}))
vi.mock('../app/providers/RoleTargetsProvider', () => ({
  RoleTargetsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { ConfigBento } from '../app/components/config/bento/ConfigBento'

function Wrapper() {
  return (
    <MantineProvider>
      <ConfigBento />
    </MantineProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSearchParams.get.mockReturnValue(null) // defaults to 'profile' tab
})

describe('ConfigBento — tab structure', () => {
  it('renders three tab triggers: Profile, Scanner, CV', () => {
    render(<Wrapper />)
    expect(screen.getByRole('tab', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /scanner/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /cv/i })).toBeInTheDocument()
  })

  it('Profile tab is active by default when no URL param is set', () => {
    render(<Wrapper />)
    expect(screen.getByRole('tab', { name: /profile/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('mounts with Scanner tab active when ?section=scanner', () => {
    mockSearchParams.get.mockReturnValue('scanner')
    render(<Wrapper />)
    expect(screen.getByRole('tab', { name: /scanner/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('mounts with CV tab active when ?section=cv', () => {
    mockSearchParams.get.mockReturnValue('cv')
    render(<Wrapper />)
    expect(screen.getByRole('tab', { name: /cv/i })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('ConfigBento — Profile tab content', () => {
  beforeEach(() => {
    mockSearchParams.get.mockReturnValue('profile')
  })

  it('renders all six profile tiles', () => {
    render(<Wrapper />)
    expect(screen.getByTestId('tile-identity')).toBeInTheDocument()
    expect(screen.getByTestId('tile-narrative')).toBeInTheDocument()
    expect(screen.getByTestId('tile-target-roles')).toBeInTheDocument()
    expect(screen.getByTestId('tile-compensation')).toBeInTheDocument()
    expect(screen.getByTestId('tile-work-prefs')).toBeInTheDocument()
    expect(screen.getByTestId('tile-proof-points')).toBeInTheDocument()
  })

  it('does not render scanner or cv tiles while on Profile tab', () => {
    render(<Wrapper />)
    expect(screen.queryByTestId('tile-discovery')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tile-search-filters')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tile-location-filter')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tile-cv-output')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tile-pdf-gate')).not.toBeInTheDocument()
  })
})

describe('ConfigBento — Scanner tab content', () => {
  beforeEach(() => {
    mockSearchParams.get.mockReturnValue('scanner')
  })

  it('renders DiscoveryTile, SearchFiltersTile, and LocationFilterTile', () => {
    render(<Wrapper />)
    expect(screen.getByTestId('tile-discovery')).toBeInTheDocument()
    expect(screen.getByTestId('tile-search-filters')).toBeInTheDocument()
    expect(screen.getByTestId('tile-location-filter')).toBeInTheDocument()
  })

  it('does not render profile or cv tiles while on Scanner tab', () => {
    render(<Wrapper />)
    expect(screen.queryByTestId('tile-identity')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tile-target-roles')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tile-cv-output')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tile-pdf-gate')).not.toBeInTheDocument()
  })
})

describe('ConfigBento — CV tab content', () => {
  beforeEach(() => {
    mockSearchParams.get.mockReturnValue('cv')
  })

  it('renders CvOutputTile and PdfGateTile', () => {
    render(<Wrapper />)
    expect(screen.getByTestId('tile-cv-output')).toBeInTheDocument()
    expect(screen.getByTestId('tile-pdf-gate')).toBeInTheDocument()
  })

  it('does not render profile or scanner tiles while on CV tab', () => {
    render(<Wrapper />)
    expect(screen.queryByTestId('tile-identity')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tile-discovery')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tile-location-filter')).not.toBeInTheDocument()
  })
})

describe('ConfigBento — URL sync', () => {
  it('pushes ?section=scanner when Scanner tab is clicked', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    await user.click(screen.getByRole('tab', { name: /scanner/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('section=scanner'),
        expect.objectContaining({ scroll: false }),
      )
    })
  })

  it('pushes ?section=cv when CV tab is clicked', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    await user.click(screen.getByRole('tab', { name: /cv/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('section=cv'),
        expect.objectContaining({ scroll: false }),
      )
    })
  })

  it('pushes ?section=profile when Profile tab is clicked', async () => {
    mockSearchParams.get.mockReturnValue('scanner')
    const user = userEvent.setup()
    render(<Wrapper />)

    await user.click(screen.getByRole('tab', { name: /profile/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('section=profile'),
        expect.objectContaining({ scroll: false }),
      )
    })
  })
})
