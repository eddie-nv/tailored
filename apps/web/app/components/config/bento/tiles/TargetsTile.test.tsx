'use client'

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { TargetsTile } from './TargetsTile'

type CustomPortal = {
  id: string
  name: string
  url: string
  enabled: boolean
  provider: string | null
  api: string | null
  method: 'auto' | 'websearch'
  query: string | null
  notes: string | null
}

function setupFetch(options: {
  platforms?: string[]
  portals?: CustomPortal[]
} = {}) {
  return vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    const method = (init?.method ?? 'GET').toUpperCase()

    if (url === '/api/config/discovery' && method === 'GET') {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              portals: options.platforms ?? [],
              minScore: null,
              titleFilter: null,
              locationFilter: null,
            },
          }),
      })
    }

    if (url === '/api/config/portals' && method === 'GET') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: options.portals ?? [] }),
      })
    }

    // mutations — POST, PATCH, DELETE
    const first = options.portals?.[0]
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          data: first
            ? { ...first, id: first.id }
            : { id: 'new-1', name: 'New Co', url: 'https://new.co', enabled: true, provider: null, api: null, method: 'auto', query: null, notes: null },
        }),
    })
  })
}

function Wrapper() {
  return (
    <MantineProvider>
      <TargetsTile />
    </MantineProvider>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── Preset rows ────────────────────────────────────────────────────────────

describe('TargetsTile — preset rows', () => {
  it('always renders Ashby, Greenhouse, Lever rows', async () => {
    vi.stubGlobal('fetch', setupFetch())
    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByText('Ashby')).toBeInTheDocument()
      expect(screen.getByText('Greenhouse')).toBeInTheDocument()
      expect(screen.getByText('Lever')).toBeInTheDocument()
    })
  })

  it('reflects pre-saved enabled platforms from API', async () => {
    vi.stubGlobal('fetch', setupFetch({ platforms: ['ashby', 'lever'] }))
    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'Disable Ashby' })).toBeChecked()
      expect(screen.getByRole('switch', { name: 'Disable Lever' })).toBeChecked()
      expect(screen.getByRole('switch', { name: 'Enable Greenhouse' })).not.toBeChecked()
    })
  })

  it('toggling a preset calls PATCH /api/config/discovery with updated platforms', async () => {
    const user = userEvent.setup()
    const fetchMock = setupFetch({ platforms: [] })
    vi.stubGlobal('fetch', fetchMock)

    render(<Wrapper />)
    await screen.findByRole('switch', { name: 'Enable Ashby' })

    await user.click(screen.getByRole('switch', { name: 'Enable Ashby' }))

    await waitFor(
      () => {
        const patch = fetchMock.mock.calls.find(
          (c) => c[0] === '/api/config/discovery' && c[1]?.method === 'PATCH',
        )
        expect(patch).toBeDefined()
        const body = JSON.parse(patch![1].body as string)
        expect(body.portals).toContain('ashby')
      },
      { timeout: 2000 },
    )
  })

  it('preset rows have no delete button', async () => {
    vi.stubGlobal('fetch', setupFetch())
    render(<Wrapper />)

    await waitFor(() => expect(screen.getByText('Ashby')).toBeInTheDocument())

    expect(screen.queryByRole('button', { name: /remove ashby/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remove greenhouse/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remove lever/i })).not.toBeInTheDocument()
  })
})

// ─── Custom target list ─────────────────────────────────────────────────────

describe('TargetsTile — custom target list', () => {
  it('renders empty state when no custom portals', async () => {
    vi.stubGlobal('fetch', setupFetch({ portals: [] }))
    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByText(/no custom targets yet/i)).toBeInTheDocument()
    })
  })

  it('renders an entry with method=auto and detectable URL with API badge', async () => {
    vi.stubGlobal(
      'fetch',
      setupFetch({
        portals: [
          {
            id: '1', name: 'Acme', url: 'https://jobs.ashbyhq.com/acme',
            enabled: true, provider: null, api: null, method: 'auto', query: null, notes: null,
          },
        ],
      }),
    )
    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByText('Acme')).toBeInTheDocument()
      expect(screen.getByText('API')).toBeInTheDocument()
    })
  })

  it('renders an entry with method=websearch with Search badge', async () => {
    vi.stubGlobal(
      'fetch',
      setupFetch({
        portals: [
          {
            id: '1', name: 'Lindy', url: 'https://lindy.ai/careers',
            enabled: true, provider: null, api: null, method: 'websearch',
            query: 'site:lindy.ai jobs', notes: null,
          },
        ],
      }),
    )
    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByText('Lindy')).toBeInTheDocument()
      expect(screen.getByText('Search')).toBeInTheDocument()
    })
  })

  it('renders an entry with method=auto and unknown URL with Unknown badge', async () => {
    vi.stubGlobal(
      'fetch',
      setupFetch({
        portals: [
          {
            id: '1', name: 'Mystery Corp', url: 'https://mysterycorp.io/jobs',
            enabled: true, provider: null, api: null, method: 'auto', query: null, notes: null,
          },
        ],
      }),
    )
    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByText('Mystery Corp')).toBeInTheDocument()
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })
  })

  it('toggling enabled fires PATCH to /api/config/portals/[id]', async () => {
    const user = userEvent.setup()
    const fetchMock = setupFetch({
      portals: [
        {
          id: 'p1', name: 'Acme', url: 'https://jobs.ashbyhq.com/acme',
          enabled: true, provider: null, api: null, method: 'auto', query: null, notes: null,
        },
      ],
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<Wrapper />)
    const toggle = await screen.findByRole('switch', { name: 'Disable Acme' })
    await user.click(toggle)

    await waitFor(
      () => {
        const patch = fetchMock.mock.calls.find(
          (c) => c[0] === '/api/config/portals/p1' && c[1]?.method === 'PATCH',
        )
        expect(patch).toBeDefined()
        const body = JSON.parse(patch![1].body as string)
        expect(body.enabled).toBe(false)
      },
      { timeout: 2000 },
    )
  })

  it('delete button fires DELETE and removes the row', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      setupFetch({
        portals: [
          {
            id: 'p1', name: 'Acme', url: 'https://acme.com',
            enabled: true, provider: null, api: null, method: 'auto', query: null, notes: null,
          },
        ],
      }),
    )

    render(<Wrapper />)
    await screen.findByText('Acme')

    await user.click(screen.getByRole('button', { name: /remove acme/i }))

    await waitFor(() => {
      expect(screen.queryByText('Acme')).not.toBeInTheDocument()
    })
  })
})

// ─── AddTargetForm ──────────────────────────────────────────────────────────

describe('TargetsTile — add target form', () => {
  it('query textarea is hidden when method is auto (default)', async () => {
    vi.stubGlobal('fetch', setupFetch())
    render(<Wrapper />)

    await waitFor(() => expect(screen.getByText('Ashby')).toBeInTheDocument())

    expect(screen.queryByLabelText(/search query/i)).not.toBeInTheDocument()
  })

  it('query textarea appears after switching method to websearch', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', setupFetch())
    render(<Wrapper />)

    await waitFor(() => expect(screen.getByText('Ashby')).toBeInTheDocument())

    const addFormSelect = screen.getByRole('combobox', { name: /method/i })
    await user.selectOptions(addFormSelect, 'websearch')

    expect(screen.getByLabelText(/search query/i)).toBeInTheDocument()
  })

  it('submitting posts to /api/config/portals with correct fields', async () => {
    const user = userEvent.setup()
    const fetchMock = setupFetch()
    vi.stubGlobal('fetch', fetchMock)

    render(<Wrapper />)
    await waitFor(() => expect(screen.getByText('Ashby')).toBeInTheDocument())

    await user.type(screen.getByLabelText(/company name/i), 'Acme Corp')
    await user.type(screen.getByLabelText(/careers url/i), 'https://acme.com/jobs')

    await user.click(screen.getByRole('button', { name: /\+ add target/i }))

    await waitFor(
      () => {
        const post = fetchMock.mock.calls.find(
          (c) => c[0] === '/api/config/portals' && c[1]?.method === 'POST',
        )
        expect(post).toBeDefined()
        const body = JSON.parse(post![1].body as string)
        expect(body.name).toBe('Acme Corp')
        expect(body.url).toBe('https://acme.com/jobs')
        expect(body.method).toBe('auto')
      },
      { timeout: 2000 },
    )
  })

  it('form fields clear after successful add', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', setupFetch())

    render(<Wrapper />)
    await waitFor(() => expect(screen.getByText('Ashby')).toBeInTheDocument())

    const nameInput = screen.getByLabelText(/company name/i)
    const urlInput = screen.getByLabelText(/careers url/i)

    await user.type(nameInput, 'Acme Corp')
    await user.type(urlInput, 'https://acme.com/jobs')
    await user.click(screen.getByRole('button', { name: /\+ add target/i }))

    await waitFor(() => {
      expect((nameInput as HTMLInputElement).value).toBe('')
      expect((urlInput as HTMLInputElement).value).toBe('')
    })
  })
})
