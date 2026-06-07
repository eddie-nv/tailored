import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { CompanyWatchlistTile } from './CompanyWatchlistTile'

const PORTALS = [
  {
    id: '1',
    name: 'Airbnb',
    url: 'https://careers.airbnb.com',
    enabled: true,
    provider: 'Greenhouse',
    api: null,
    notes: 'Platform team',
  },
]

function renderTile() {
  return render(
    <MantineProvider>
      <CompanyWatchlistTile />
    </MantineProvider>,
  )
}

describe('CompanyWatchlistTile', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: PORTALS }),
      body: null,
    } as unknown as Response)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loader while fetching', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))
    renderTile()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders portal list after data loads', async () => {
    renderTile()
    expect(await screen.findByText('Airbnb')).toBeInTheDocument()
  })

  it('renders the tile heading', async () => {
    renderTile()
    expect(await screen.findByText(/company watchlist/i)).toBeInTheDocument()
  })

  it('renders the add portal form after data loads', async () => {
    renderTile()
    await screen.findByText('Airbnb')
    expect(screen.getByRole('button', { name: /add portal/i })).toBeInTheDocument()
  })
})
