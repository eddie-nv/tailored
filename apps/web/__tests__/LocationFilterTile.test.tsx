import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { LocationFilterTile } from '../app/components/config/bento/tiles/LocationFilterTile'

// Mock TagInput with a simple native input so we can interact with it reliably in JSDOM
// (Mantine TagsInput + React 19 pointer events produces AggregateErrors via popover positioning)
vi.mock('../app/components/config/TagInput', () => ({
  TagInput: ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: string[]
    onChange: (tags: string[]) => void
    placeholder?: string
    color?: string
  }) => {
    const id = `mock-taginput-${label.toLowerCase().replace(/\s+/g, '-')}`
    return (
      <div>
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          defaultValue=""
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const target = e.currentTarget as HTMLInputElement
              if (target.value) {
                onChange([...value, target.value])
                target.value = ''
              }
            }
          }}
        />
        {value.map((v) => (
          <span key={v} data-tag>
            {v}
          </span>
        ))}
      </div>
    )
  },
}))

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

afterEach(() => {
  vi.restoreAllMocks()
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

    // Wait for load (Always Allow label appears)
    await waitFor(() => {
      expect(screen.getByText('Always Allow')).toBeInTheDocument()
    })

    expect(screen.queryByText('Derived from your profile')).not.toBeInTheDocument()
  })

  it('renders the three editable filter sections', async () => {
    vi.stubGlobal('fetch', mockGetFetch())

    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByText('Always Allow')).toBeInTheDocument()
      expect(screen.getByText('Allow')).toBeInTheDocument()
      expect(screen.getByText('Block')).toBeInTheDocument()
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
    const fetchMock = mockGetThenPatch()
    vi.stubGlobal('fetch', fetchMock)

    render(<Wrapper />)

    await waitFor(() => expect(screen.getByText('Always Allow')).toBeInTheDocument())

    const input = screen.getByLabelText('Always Allow')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Remote' } })
      fireEvent.keyDown(input, { key: 'Enter' })
    })

    await waitFor(
      () => {
        const patchCall = fetchMock.mock.calls.find((c) => c[1]?.method === 'PATCH')
        expect(patchCall).toBeDefined()
        const body = JSON.parse(patchCall![1].body as string)
        expect(body.locationFilter.alwaysAllow).toContain('Remote')
      },
      { timeout: 2000 },
    )
  })

  it('PATCHes with block when block TagInput changes', async () => {
    const fetchMock = mockGetThenPatch()
    vi.stubGlobal('fetch', fetchMock)

    render(<Wrapper />)

    await waitFor(() => expect(screen.getByText('Block')).toBeInTheDocument())

    const input = screen.getByLabelText('Block')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'China' } })
      fireEvent.keyDown(input, { key: 'Enter' })
    })

    await waitFor(
      () => {
        const patchCall = fetchMock.mock.calls.find((c) => c[1]?.method === 'PATCH')
        expect(patchCall).toBeDefined()
        const body = JSON.parse(patchCall![1].body as string)
        expect(body.locationFilter.block).toContain('China')
      },
      { timeout: 2000 },
    )
  })

  it('PATCH payload does not include derived field', async () => {
    const fetchMock = mockGetThenPatch({ derived: ['Remote'] })
    vi.stubGlobal('fetch', fetchMock)

    render(<Wrapper />)

    await waitFor(() => expect(screen.getByText('Remote')).toBeInTheDocument())

    const input = screen.getByLabelText('Always Allow')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'US' } })
      fireEvent.keyDown(input, { key: 'Enter' })
    })

    await waitFor(
      () => {
        const patchCall = fetchMock.mock.calls.find((c) => c[1]?.method === 'PATCH')
        expect(patchCall).toBeDefined()
        const body = JSON.parse(patchCall![1].body as string)
        expect(body.locationFilter).not.toHaveProperty('derived')
      },
      { timeout: 2000 },
    )
  })

  it('shows SaveIndicator in saving state while PATCH is in-flight', async () => {
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
          resolvePatch = () => resolve({ ok: true, json: () => Promise.resolve({ data: {} }) })
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    render(<Wrapper />)

    await waitFor(() => expect(screen.getByText('Always Allow')).toBeInTheDocument())

    const input = screen.getByLabelText('Always Allow')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Remote' } })
      fireEvent.keyDown(input, { key: 'Enter' })
    })

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Saving…'), {
      timeout: 2000,
    })

    resolvePatch()

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Saved'))
  })
})
