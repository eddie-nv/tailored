'use client'

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { RoleTargetsProvider } from '../../../../providers/RoleTargetsProvider'
import { SearchFiltersTile } from './SearchFiltersTile'

vi.mock('../../../TagInput', () => ({
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

type LocationFilter = {
  derived: string[]
  allow: string[]
  block: string[]
  alwaysAllow: string[]
}

function makeDiscoveryResponse(
  overrides: {
    minScore?: string | null
    locationFilter?: Partial<LocationFilter>
    titleFilter?: Record<string, unknown> | null
  } = {},
) {
  const locationFilter: LocationFilter = {
    derived: [],
    allow: [],
    block: [],
    alwaysAllow: [],
    ...(overrides.locationFilter ?? {}),
  }
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        data: {
          minScore: overrides.minScore ?? null,
          titleFilter: overrides.titleFilter ?? {
            derived: [],
            custom: [],
            negative: [],
            seniorityBoost: ['Senior'],
          },
          locationFilter,
        },
      }),
  }
}

function mockGetThenPatch(overrides: Parameters<typeof makeDiscoveryResponse>[0] = {}) {
  return vi
    .fn()
    .mockResolvedValueOnce(makeDiscoveryResponse(overrides))
    .mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: {} }) })
}

function Wrapper() {
  return (
    <MantineProvider>
      <RoleTargetsProvider>
        <SearchFiltersTile />
      </RoleTargetsProvider>
    </MantineProvider>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SearchFiltersTile — render', () => {
  it('renders the min score selector with value from API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeDiscoveryResponse({ minScore: 'B' })))

    render(<Wrapper />)

    await waitFor(() => {
      const select = screen.getByRole('combobox', { name: /minimum score/i })
      expect(select).toBeInTheDocument()
      expect((select as HTMLSelectElement).value).toBe('B')
    })
  })

  it('renders the location always-allow, allow, block tag inputs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeDiscoveryResponse()))

    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByLabelText('Always Allow')).toBeInTheDocument()
      expect(screen.getByLabelText('Allow')).toBeInTheDocument()
      expect(screen.getByLabelText('Block')).toBeInTheDocument()
    })
  })

  it('renders derived location badges as read-only when present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeDiscoveryResponse({ locationFilter: { derived: ['Remote', 'Hybrid'] } })),
    )

    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByText('Remote')).toBeInTheDocument()
      expect(screen.getByText('Hybrid')).toBeInTheDocument()
    })
  })

  it('does not render location derived section when derived is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeDiscoveryResponse()))

    render(<Wrapper />)

    await waitFor(() => expect(screen.getByLabelText('Always Allow')).toBeInTheDocument())

    expect(screen.queryByText('Location hints from your profile')).not.toBeInTheDocument()
  })

  it('renders existing allow tags from API data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        makeDiscoveryResponse({ locationFilter: { allow: ['Europe', 'Canada'] } }),
      ),
    )

    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByText('Europe')).toBeInTheDocument()
      expect(screen.getByText('Canada')).toBeInTheDocument()
    })
  })
})

describe('SearchFiltersTile — save behaviour', () => {
  it('changing min score triggers a PATCH with minScore in the body', async () => {
    const user = userEvent.setup()
    const fetchMock = mockGetThenPatch()
    vi.stubGlobal('fetch', fetchMock)

    render(<Wrapper />)

    await screen.findByRole('combobox', { name: /minimum score/i })

    const select = screen.getByRole('combobox', { name: /minimum score/i })
    await user.selectOptions(select, 'C')

    await waitFor(
      () => {
        const patch = fetchMock.mock.calls.find((c) => c[1]?.method === 'PATCH')
        expect(patch).toBeDefined()
        const body = JSON.parse(patch![1].body as string)
        expect(body.minScore).toBe('C')
      },
      { timeout: 2000 },
    )
  })

  it('adding a tag to allow list triggers a PATCH with the location in the body', async () => {
    const fetchMock = mockGetThenPatch()
    vi.stubGlobal('fetch', fetchMock)

    render(<Wrapper />)

    await waitFor(() => expect(screen.getByLabelText('Allow')).toBeInTheDocument())

    const input = screen.getByLabelText('Allow')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Europe' } })
      fireEvent.keyDown(input, { key: 'Enter' })
    })

    await waitFor(
      () => {
        const patch = fetchMock.mock.calls.find((c) => c[1]?.method === 'PATCH')
        expect(patch).toBeDefined()
        const body = JSON.parse(patch![1].body as string)
        expect(body.locationFilter.allow).toContain('Europe')
      },
      { timeout: 2000 },
    )
  })

  it('removing a tag from block list triggers a PATCH without the removed item', async () => {
    const fetchMock = mockGetThenPatch({ locationFilter: { block: ['China'] } })
    vi.stubGlobal('fetch', fetchMock)

    render(<Wrapper />)

    await waitFor(() => expect(screen.getByText('China')).toBeInTheDocument())

    const input = screen.getByLabelText('Block')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Russia' } })
      fireEvent.keyDown(input, { key: 'Enter' })
    })

    await waitFor(
      () => {
        const patch = fetchMock.mock.calls.find((c) => c[1]?.method === 'PATCH')
        expect(patch).toBeDefined()
        const body = JSON.parse(patch![1].body as string)
        expect(body.locationFilter.block).toContain('China')
        expect(body.locationFilter.block).toContain('Russia')
      },
      { timeout: 2000 },
    )
  })

  it('PATCH body includes titleFilter and locationFilter together (single save)', async () => {
    const fetchMock = mockGetThenPatch()
    vi.stubGlobal('fetch', fetchMock)

    render(<Wrapper />)

    await waitFor(() => expect(screen.getByLabelText('Always Allow')).toBeInTheDocument())

    const input = screen.getByLabelText('Always Allow')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Remote' } })
      fireEvent.keyDown(input, { key: 'Enter' })
    })

    await waitFor(
      () => {
        const patch = fetchMock.mock.calls.find((c) => c[1]?.method === 'PATCH')
        expect(patch).toBeDefined()
        const body = JSON.parse(patch![1].body as string)
        expect(body).toHaveProperty('titleFilter')
        expect(body).toHaveProperty('locationFilter')
        expect(body.locationFilter.alwaysAllow).toContain('Remote')
      },
      { timeout: 2000 },
    )
  })

  it('PATCH payload omits locationFilter.derived', async () => {
    const fetchMock = mockGetThenPatch({ locationFilter: { derived: ['Remote'] } })
    vi.stubGlobal('fetch', fetchMock)

    render(<Wrapper />)

    await waitFor(() => expect(screen.getByText('Remote')).toBeInTheDocument())

    const input = screen.getByLabelText('Allow')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'US' } })
      fireEvent.keyDown(input, { key: 'Enter' })
    })

    await waitFor(
      () => {
        const patch = fetchMock.mock.calls.find((c) => c[1]?.method === 'PATCH')
        expect(patch).toBeDefined()
        const body = JSON.parse(patch![1].body as string)
        expect(body.locationFilter).not.toHaveProperty('derived')
      },
      { timeout: 2000 },
    )
  })
})
