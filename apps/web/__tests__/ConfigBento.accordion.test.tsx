import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'

// --- next/navigation mock ---
const mockPush = vi.fn()
const mockSearchParams = { get: vi.fn(), toString: vi.fn(() => '') }

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}))

// --- Tile mocks ---
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
vi.mock('../app/components/config/bento/tiles/BroadDiscoveryTile', () => ({
  BroadDiscoveryTile: () => <div data-testid="tile-broad-discovery" />,
}))
vi.mock('../app/components/config/bento/tiles/CompanyWatchlistTile', () => ({
  CompanyWatchlistTile: () => <div data-testid="tile-company-watchlist" />,
}))
vi.mock('../app/components/config/bento/tiles/DiscoveryQueriesTile', () => ({
  DiscoveryQueriesTile: () => <div data-testid="tile-discovery-queries" />,
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
  mockSearchParams.get.mockReturnValue(null)
  mockSearchParams.toString.mockReturnValue('')
})

describe('ConfigBento — accordion structure', () => {
  it('renders three accordion section buttons: Profile, Scanner, CV', () => {
    render(<Wrapper />)
    expect(screen.getByRole('button', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /scanner/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cv/i })).toBeInTheDocument()
  })

  it('Profile drawer is open by default when no URL param is set', () => {
    render(<Wrapper />)
    expect(screen.getByTestId('tile-identity')).toBeInTheDocument()
  })

  it('Scanner and CV drawers are closed by default when no URL param is set', () => {
    render(<Wrapper />)
    expect(screen.queryByTestId('tile-broad-discovery')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tile-cv-output')).not.toBeInTheDocument()
  })
})

describe('ConfigBento — URL param hydration', () => {
  it('opens Profile drawer when ?open=profile', () => {
    mockSearchParams.get.mockImplementation((key: string) =>
      key === 'open' ? 'profile' : null,
    )
    render(<Wrapper />)
    expect(screen.getByTestId('tile-identity')).toBeInTheDocument()
  })

  it('opens Scanner drawer when ?open=scanner', () => {
    mockSearchParams.get.mockImplementation((key: string) =>
      key === 'open' ? 'scanner' : null,
    )
    render(<Wrapper />)
    expect(screen.getByTestId('tile-broad-discovery')).toBeInTheDocument()
    expect(screen.queryByTestId('tile-identity')).not.toBeInTheDocument()
  })

  it('opens CV drawer when ?open=cv', () => {
    mockSearchParams.get.mockImplementation((key: string) =>
      key === 'open' ? 'cv' : null,
    )
    render(<Wrapper />)
    expect(screen.getByTestId('tile-cv-output')).toBeInTheDocument()
    expect(screen.queryByTestId('tile-identity')).not.toBeInTheDocument()
  })

  it('opens multiple drawers when ?open=profile,scanner', () => {
    mockSearchParams.get.mockImplementation((key: string) =>
      key === 'open' ? 'profile,scanner' : null,
    )
    render(<Wrapper />)
    expect(screen.getByTestId('tile-identity')).toBeInTheDocument()
    expect(screen.getByTestId('tile-broad-discovery')).toBeInTheDocument()
    expect(screen.queryByTestId('tile-cv-output')).not.toBeInTheDocument()
  })
})

describe('ConfigBento — multiple open (independent drawers)', () => {
  it('opening Scanner does not close Profile', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    // Profile is open by default; open Scanner
    await user.click(screen.getByRole('button', { name: /scanner/i }))

    await waitFor(() => {
      expect(screen.getByTestId('tile-identity')).toBeInTheDocument()
      expect(screen.getByTestId('tile-broad-discovery')).toBeInTheDocument()
    })
  })

  it('closing Profile leaves Scanner open', async () => {
    mockSearchParams.get.mockImplementation((key: string) =>
      key === 'open' ? 'profile,scanner' : null,
    )
    const user = userEvent.setup()
    render(<Wrapper />)

    // Both open; close Profile
    await user.click(screen.getByRole('button', { name: /profile/i }))

    await waitFor(() => {
      expect(screen.queryByTestId('tile-identity')).not.toBeInTheDocument()
      expect(screen.getByTestId('tile-broad-discovery')).toBeInTheDocument()
    })
  })
})

describe('ConfigBento — URL sync on interaction', () => {
  it('pushes ?open=profile,scanner when Scanner is opened while Profile is open', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    await user.click(screen.getByRole('button', { name: /scanner/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/open=.*profile.*scanner|open=.*scanner.*profile/),
        expect.objectContaining({ scroll: false }),
      )
    })
  })

  it('pushes updated ?open= when a drawer is closed', async () => {
    mockSearchParams.get.mockImplementation((key: string) =>
      key === 'open' ? 'profile,scanner' : null,
    )
    mockSearchParams.toString.mockReturnValue('open=profile%2Cscanner')
    const user = userEvent.setup()
    render(<Wrapper />)

    await user.click(screen.getByRole('button', { name: /profile/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('open=scanner'),
        expect.objectContaining({ scroll: false }),
      )
    })
  })
})

describe('ConfigBento — tile content per section', () => {
  it('Profile drawer renders all six profile tiles', () => {
    render(<Wrapper />)
    expect(screen.getByTestId('tile-identity')).toBeInTheDocument()
    expect(screen.getByTestId('tile-narrative')).toBeInTheDocument()
    expect(screen.getByTestId('tile-target-roles')).toBeInTheDocument()
    expect(screen.getByTestId('tile-compensation')).toBeInTheDocument()
    expect(screen.getByTestId('tile-work-prefs')).toBeInTheDocument()
    expect(screen.getByTestId('tile-proof-points')).toBeInTheDocument()
  })

  it('Scanner drawer renders all five scanner tiles', async () => {
    mockSearchParams.get.mockImplementation((key: string) =>
      key === 'open' ? 'scanner' : null,
    )
    render(<Wrapper />)
    expect(screen.getByTestId('tile-broad-discovery')).toBeInTheDocument()
    expect(screen.getByTestId('tile-search-filters')).toBeInTheDocument()
    expect(screen.getByTestId('tile-company-watchlist')).toBeInTheDocument()
    expect(screen.getByTestId('tile-location-filter')).toBeInTheDocument()
    expect(screen.getByTestId('tile-discovery-queries')).toBeInTheDocument()
  })

  it('CV drawer renders two CV tiles', async () => {
    mockSearchParams.get.mockImplementation((key: string) =>
      key === 'open' ? 'cv' : null,
    )
    render(<Wrapper />)
    expect(screen.getByTestId('tile-cv-output')).toBeInTheDocument()
    expect(screen.getByTestId('tile-pdf-gate')).toBeInTheDocument()
  })
})
