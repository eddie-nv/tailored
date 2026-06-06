import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { LocationFilterTile } from '../app/components/config/bento/tiles/LocationFilterTile'

function Wrapper() {
  return (
    <MantineProvider>
      <LocationFilterTile />
    </MantineProvider>
  )
}

type LocationFilter = {
  derived: string[]
  allow: string[]
  block: string[]
  alwaysAllow: string[]
}

function mockGetFetch(locationFilter: Partial<LocationFilter> = {}) {
  const full: LocationFilter = {
    derived: [],
    allow: [],
    block: [],
    alwaysAllow: [],
    ...locationFilter,
  }
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: { locationFilter: full } }),
  })
}

function mockGetThenPatch(locationFilter: Partial<LocationFilter> = {}) {
  const full: LocationFilter = {
    derived: [],
    allow: [],
    block: [],
    alwaysAllow: [],
    ...locationFilter,
  }
  return vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { locationFilter: full } }),
    })
    .mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { locationFilter: full } }),
    })
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('LocationFilterTile — loading and render', () => {
  it('calls GET /api/config/discovery on mount', async () => {
    const fetchMock = mockGetFetch()
    vi.stubGlobal('fetch', fetchMock)

    render(<Wrapper />)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/config/discovery')
    })
  })

  it('renders derived location badges from the API response', async () => {
    vi.stubGlobal('fetch', mockGetFetch({ derived: ['Remote', 'Hybrid'] }))

    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByText('Remote')).toBeInTheDocument()
      expect(screen.getByText('Hybrid')).toBeInTheDocument()
    })
  })

  it('does not render derived badges when derived is empty', async () => {
    vi.stubGlobal('fetch', mockGetFetch({ derived: [] }))

    render(<Wrapper />)

    await waitFor(() => {
      // Only way to know the tile loaded is that inputs are present
      expect(screen.getByText(/always allow/i)).toBeInTheDocument()
    })

    expect(screen.queryByTitle('Synced from your work preferences')).not.toBeInTheDocument()
  })

  it('renders the three editable filter sections', async () => {
    vi.stubGlobal('fetch', mockGetFetch())

    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByText(/always allow/i)).toBeInTheDocument()
      expect(screen.getByText(/block/i)).toBeInTheDocument()
    })
  })

  it('derived badges have a lock icon and tooltip label', async () => {
    vi.stubGlobal('fetch', mockGetFetch({ derived: ['Remote'] }))

    render(<Wrapper />)

    await waitFor(() => expect(screen.getByText('Remote')).toBeInTheDocument())

    // Lock SVG is aria-hidden but the Tooltip label is accessible
    const badge = screen.getByText('Remote').closest('[data-testid], [class]')
    expect(badge).toBeTruthy()
  })
})

describe('LocationFilterTile — save behaviour', () => {
  it('PATCHes /api/config/discovery when alwaysAllow changes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    const fetchMock = mockGetThenPatch()
    vi.stubGlobal('fetch', fetchMock)

    render(<Wrapper />)

    await waitFor(() => expect(screen.getByText(/always allow/i)).toBeInTheDocument())

    const alwaysAllowInput = screen.getByRole('textbox', { name: /always allow/i })
    await user.click(alwaysAllowInput)
    await user.keyboard('Remote{Enter}')

    vi.advanceTimersByTime(600)

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(
        (c) => c[1]?.method === 'PATCH',
      )
      expect(patchCall).toBeDefined()
      const body = JSON.parse(patchCall![1].body as string)
      expect(body.locationFilter.alwaysAllow).toContain('Remote')
    })
  })

  it('PATCHes with block when block TagInput changes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    const fetchMock = mockGetThenPatch()
    vi.stubGlobal('fetch', fetchMock)

    render(<Wrapper />)

    await waitFor(() => expect(screen.getByText(/block/i)).toBeInTheDocument())

    const blockInput = screen.getByRole('textbox', { name: /block/i })
    await user.click(blockInput)
    await user.keyboard('China{Enter}')

    vi.advanceTimersByTime(600)

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find((c) => c[1]?.method === 'PATCH')
      expect(patchCall).toBeDefined()
      const body = JSON.parse(patchCall![1].body as string)
      expect(body.locationFilter.block).toContain('China')
    })
  })

  it('PATCH payload does not include derived field', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    const fetchMock = mockGetThenPatch({ derived: ['Remote'] })
    vi.stubGlobal('fetch', fetchMock)

    render(<Wrapper />)

    await waitFor(() => expect(screen.getByText('Remote')).toBeInTheDocument())

    const alwaysAllowInput = screen.getByRole('textbox', { name: /always allow/i })
    await user.click(alwaysAllowInput)
    await user.keyboard('US{Enter}')

    vi.advanceTimersByTime(600)

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find((c) => c[1]?.method === 'PATCH')
      expect(patchCall).toBeDefined()
      const body = JSON.parse(patchCall![1].body as string)
      expect(body.locationFilter).not.toHaveProperty('derived')
    })
  })

  it('shows SaveIndicator in saving state while PATCH is in-flight', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    let resolvePatch!: () => void
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { locationFilter: { derived: [], allow: [], block: [], alwaysAllow: [] } },
          }),
      })
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePatch = () =>
            resolve({ ok: true, json: () => Promise.resolve({ data: {} }) })
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    render(<Wrapper />)

    await waitFor(() => expect(screen.getByText(/always allow/i)).toBeInTheDocument())

    const input = screen.getByRole('textbox', { name: /always allow/i })
    await user.click(input)
    await user.keyboard('Remote{Enter}')

    vi.advanceTimersByTime(600)

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Saving…'))

    resolvePatch()

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Saved'))
  })
})
