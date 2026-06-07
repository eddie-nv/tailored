import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { BroadDiscoveryTile } from '../app/components/config/bento/tiles/BroadDiscoveryTile'

function Wrapper() {
  return (
    <MantineProvider>
      <BroadDiscoveryTile />
    </MantineProvider>
  )
}

function mockDiscovery(portals: string[], minScore: string | null = null) {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        data: { portals, minScore, keywords: [], titleFilter: null, locationFilter: null },
      }),
  }
}

function mockPatch() {
  return { ok: true, json: () => Promise.resolve({ data: {} }) }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BroadDiscoveryTile — rendering', () => {
  it('shows a loading spinner before data arrives', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise(() => {})), // never resolves
    )
    render(<Wrapper />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders three platform toggle cards after load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockDiscovery([])))
    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByText('Ashby')).toBeInTheDocument()
      expect(screen.getByText('Greenhouse')).toBeInTheDocument()
      expect(screen.getByText('Lever')).toBeInTheDocument()
    })
  })

  it('renders platform taglines', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockDiscovery([])))
    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByText('AI/dev-tool startups')).toBeInTheDocument()
      expect(screen.getByText('Enterprise & growth-stage')).toBeInTheDocument()
      expect(screen.getByText('Series A–C startups')).toBeInTheDocument()
    })
  })

  it('shows an error message when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load scanner/i)).toBeInTheDocument()
    })
  })

  it('reflects pre-saved enabled platforms', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockDiscovery(['ashby', 'lever'])))
    render(<Wrapper />)

    await waitFor(() => {
      const ashbySwitch = screen.getByRole('switch', { name: 'Enable Ashby' })
      const leverSwitch = screen.getByRole('switch', { name: 'Enable Lever' })
      const ghSwitch = screen.getByRole('switch', { name: 'Enable Greenhouse' })
      expect(ashbySwitch).toBeChecked()
      expect(leverSwitch).toBeChecked()
      expect(ghSwitch).not.toBeChecked()
    })
  })
})

describe('BroadDiscoveryTile — interactions', () => {
  it('toggling Ashby on calls PATCH with portals: ["ashby"]', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(mockDiscovery([]))
        .mockResolvedValue(mockPatch()),
    )

    render(<Wrapper />)

    const ashbySwitch = await screen.findByRole('switch', { name: 'Enable Ashby' })
    await user.click(ashbySwitch)

    await waitFor(
      () => {
        const calls = vi.mocked(fetch).mock.calls
        const patch = calls.find((c) => (c[1] as RequestInit)?.method === 'PATCH')
        expect(patch).toBeTruthy()
        const body = JSON.parse((patch![1] as RequestInit).body as string)
        expect(body.portals).toEqual(['ashby'])
      },
      { timeout: 2000 },
    )
  })

  it('toggling all three platforms on produces portals: ["ashby", "greenhouse", "lever"]', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(mockDiscovery([]))
        .mockResolvedValue(mockPatch()),
    )

    render(<Wrapper />)

    await screen.findByRole('switch', { name: 'Enable Ashby' })

    await user.click(screen.getByRole('switch', { name: 'Enable Ashby' }))
    await user.click(screen.getByRole('switch', { name: 'Enable Greenhouse' }))
    await user.click(screen.getByRole('switch', { name: 'Enable Lever' }))

    await waitFor(
      () => {
        const calls = vi.mocked(fetch).mock.calls
        const patches = calls.filter((c) => (c[1] as RequestInit)?.method === 'PATCH')
        const lastPatch = patches[patches.length - 1]
        expect(lastPatch).toBeTruthy()
        const body = JSON.parse((lastPatch[1] as RequestInit).body as string)
        expect(body.portals).toEqual(['ashby', 'greenhouse', 'lever'])
      },
      { timeout: 3000 },
    )
  })

  it('toggling Ashby off removes it from portals', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(mockDiscovery(['ashby', 'greenhouse']))
        .mockResolvedValue(mockPatch()),
    )

    render(<Wrapper />)

    const ashbySwitch = await screen.findByRole('switch', { name: 'Enable Ashby' })
    await user.click(ashbySwitch)

    await waitFor(
      () => {
        const calls = vi.mocked(fetch).mock.calls
        const patch = calls.find((c) => (c[1] as RequestInit)?.method === 'PATCH')
        expect(patch).toBeTruthy()
        const body = JSON.parse((patch![1] as RequestInit).body as string)
        expect(body.portals).toEqual(['greenhouse'])
      },
      { timeout: 2000 },
    )
  })

  it('min score select fires PATCH with correct minScore value', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(mockDiscovery([]))
        .mockResolvedValue(mockPatch()),
    )

    render(<Wrapper />)

    await screen.findByRole('switch', { name: 'Enable Ashby' })

    const select = screen.getByRole('combobox', { name: /minimum score/i })
    await user.selectOptions(select, 'B')

    await waitFor(
      () => {
        const calls = vi.mocked(fetch).mock.calls
        const patch = calls.find((c) => (c[1] as RequestInit)?.method === 'PATCH')
        expect(patch).toBeTruthy()
        const body = JSON.parse((patch![1] as RequestInit).body as string)
        expect(body.minScore).toBe('B')
      },
      { timeout: 2000 },
    )
  })
})
