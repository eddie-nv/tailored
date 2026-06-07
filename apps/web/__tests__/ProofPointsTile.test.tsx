import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { ProofPointsTile } from '../app/components/config/bento/tiles/ProofPointsTile'

type ProofPoint = { name: string; url: string; heroMetric: string }

function Wrapper() {
  return (
    <MantineProvider>
      <ProofPointsTile />
    </MantineProvider>
  )
}

function mockGet(proofPoints: ProofPoint[] = []) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: { proofPoints } }),
  })
}

function mockGetThenPatch(proofPoints: ProofPoint[] = []) {
  return vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { proofPoints } }),
    })
    .mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ProofPointsTile — empty state', () => {
  it('shows the empty-state CTA when proof points list is empty', async () => {
    vi.stubGlobal('fetch', mockGet([]))

    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByText('+ Add your first proof point')).toBeInTheDocument()
    })
  })

  it('does NOT show the add button when proof points list is empty', async () => {
    vi.stubGlobal('fetch', mockGet([]))

    render(<Wrapper />)

    // Wait for load to complete (empty-state text appears)
    await waitFor(() => {
      expect(screen.getByText('+ Add your first proof point')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: '+ Add proof point' })).not.toBeInTheDocument()
  })

  it('adds a blank proof point row when the empty-state CTA is clicked', async () => {
    vi.stubGlobal('fetch', mockGetThenPatch([]))
    const user = userEvent.setup()

    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByText('+ Add your first proof point')).toBeInTheDocument()
    })

    await act(async () => {
      await user.click(screen.getByText('+ Add your first proof point'))
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Launched real-time collab')).toBeInTheDocument()
    })
  })
})

describe('ProofPointsTile — non-empty state', () => {
  const existing: ProofPoint[] = [
    { name: 'Launched collab', url: 'https://example.com', heroMetric: '↑ 40% DAU' },
  ]

  it('shows the add button when proof points exist', async () => {
    vi.stubGlobal('fetch', mockGet(existing))

    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '+ Add proof point' })).toBeInTheDocument()
    })
  })

  it('does NOT show the empty-state CTA when proof points exist', async () => {
    vi.stubGlobal('fetch', mockGet(existing))

    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '+ Add proof point' })).toBeInTheDocument()
    })

    expect(screen.queryByText('+ Add your first proof point')).not.toBeInTheDocument()
  })

  it('adds a new blank row when the add button is clicked', async () => {
    vi.stubGlobal('fetch', mockGetThenPatch(existing))
    const user = userEvent.setup()

    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '+ Add proof point' })).toBeInTheDocument()
    })

    await act(async () => {
      await user.click(screen.getByRole('button', { name: '+ Add proof point' }))
    })

    // Two rows: existing + new blank — two name inputs visible
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('Launched real-time collab')).toHaveLength(2)
    })
  })
})
