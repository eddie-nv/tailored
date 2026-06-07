import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { DiscoveryQueriesTile } from './DiscoveryQueriesTile'

const QUERIES = [
  {
    id: 'sq-1',
    name: 'Ashby — AI Engineer',
    query: 'site:jobs.ashbyhq.com "AI Engineer" remote',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sq-2',
    name: 'Greenhouse — FDE',
    query: 'site:job-boards.greenhouse.io "Forward Deployed"',
    enabled: false,
    createdAt: new Date().toISOString(),
  },
]

function mockFetch(data: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: async () => data,
  } as unknown as Response)
}

function renderTile() {
  return render(
    <MantineProvider>
      <DiscoveryQueriesTile />
    </MantineProvider>,
  )
}

describe('DiscoveryQueriesTile', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: QUERIES }),
      body: null,
    } as unknown as Response)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows a loader while fetching', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))
    renderTile()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders the tile heading', async () => {
    renderTile()
    expect(await screen.findByText(/discovery queries/i)).toBeInTheDocument()
  })

  it('renders query names after data loads', async () => {
    renderTile()
    expect(await screen.findByText('Ashby — AI Engineer')).toBeInTheDocument()
    expect(screen.getByText('Greenhouse — FDE')).toBeInTheDocument()
  })

  it('renders the empty state when there are no queries', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as unknown as Response)
    renderTile()
    expect(await screen.findByText(/no search queries/i)).toBeInTheDocument()
  })

  it('calls PATCH with enabled=false when a toggle is switched off', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url, opts) => {
      const method = (opts as RequestInit | undefined)?.method
      if (method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: { ...QUERIES[0]!, enabled: false } }),
        } as unknown as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: QUERIES }),
      } as unknown as Response)
    })

    const user = userEvent.setup()
    renderTile()
    await screen.findByText('Ashby — AI Engineer')

    // Mantine Switch renders with role="switch", not "checkbox"
    const toggle = await screen.findByRole('switch', { name: /disable ashby/i })
    await user.click(toggle)

    await waitFor(() => {
      const patchCall = fetchSpy.mock.calls.find(
        ([, opts]) => (opts as RequestInit | undefined)?.method === 'PATCH',
      )
      expect(patchCall).toBeDefined()
      const body = JSON.parse((patchCall![1] as RequestInit).body as string)
      expect(body.enabled).toBe(false)
    })
  })

  it('removes a query from the list when delete is clicked', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url, opts) => {
      const method = (opts as RequestInit | undefined)?.method
      if (method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        } as unknown as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: QUERIES }),
      } as unknown as Response)
    })

    const user = userEvent.setup()
    renderTile()
    await screen.findByText('Ashby — AI Engineer')

    const deleteBtn = screen.getAllByRole('button', { name: /remove/i })[0]!
    await user.click(deleteBtn)

    await waitFor(() => {
      expect(screen.queryByText('Ashby — AI Engineer')).not.toBeInTheDocument()
    })
  })

  it('opens the presets modal when "Presets" button is clicked', async () => {
    const user = userEvent.setup()
    renderTile()
    await screen.findByText(/discovery queries/i)

    await user.click(screen.getByRole('button', { name: /presets/i }))

    // Mantine Modal renders into a portal — find the dialog element
    const dialog = await screen.findByRole('dialog', { hidden: true })
    expect(dialog.textContent).toMatch(/preset library/i)
  })

  it('calls POST and adds the query when a preset is imported', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url, opts) => {
      const method = (opts as RequestInit | undefined)?.method
      if (method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: { id: 'new', name: 'Ashby — AI Engineer', query: 'site:jobs.ashbyhq.com', enabled: true, createdAt: new Date().toISOString() },
          }),
        } as unknown as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as unknown as Response)
    })

    const user = userEvent.setup()
    renderTile()
    await screen.findByText(/discovery queries/i)

    await user.click(screen.getByRole('button', { name: /presets/i }))

    // Wait for the dialog to appear in the portal
    const dialog = await screen.findByRole('dialog', { hidden: true })
    expect(dialog).toBeTruthy()

    const importBtns = within(dialog).getAllByRole('button', { name: /import/i })
    await user.click(importBtns[0]!)

    await waitFor(() => {
      const postCall = fetchSpy.mock.calls.find(
        ([, opts]) => (opts as RequestInit | undefined)?.method === 'POST',
      )
      expect(postCall).toBeDefined()
    })
  })
})
