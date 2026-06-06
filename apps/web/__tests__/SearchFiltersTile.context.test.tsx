import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { RoleTargetsProvider, useRoleDerivedTitles } from '../app/providers/RoleTargetsProvider'
import { SearchFiltersTile } from '../app/components/config/bento/tiles/SearchFiltersTile'

function Wrapper({ derivedTitles }: { derivedTitles: string[] }) {
  return (
    <MantineProvider>
      <RoleTargetsProvider initialDerived={derivedTitles}>
        <SearchFiltersTile />
      </RoleTargetsProvider>
    </MantineProvider>
  )
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            titleFilter: {
              derived: ['Old DB Title'],
              custom: [],
              negative: [],
              seniorityBoost: ['Senior'],
            },
          },
        }),
    }),
  )
})

describe('SearchFiltersTile — context integration', () => {
  it('renders derived titles from context, not from the fetch response', async () => {
    render(<Wrapper derivedTitles={['Staff Engineer', 'Engineering Manager']} />)

    await waitFor(() => {
      expect(screen.getByText('Staff Engineer')).toBeInTheDocument()
      expect(screen.getByText('Engineering Manager')).toBeInTheDocument()
    })

    expect(screen.queryByText('Old DB Title')).not.toBeInTheDocument()
  })

  it('shows no derived badges when context is empty', async () => {
    render(<Wrapper derivedTitles={[]} />)

    await waitFor(() => {
      expect(screen.queryByText('Old DB Title')).not.toBeInTheDocument()
    })
  })

  it('updates the displayed derived badges when context changes', async () => {
    const user = userEvent.setup()

    function ContextUpdater() {
      const { setDerivedTitles } = useRoleDerivedTitles()
      return (
        <button onClick={() => setDerivedTitles(['Principal Engineer'])}>update context</button>
      )
    }

    render(
      <MantineProvider>
        <RoleTargetsProvider initialDerived={['Staff Engineer']}>
          <SearchFiltersTile />
          <ContextUpdater />
        </RoleTargetsProvider>
      </MantineProvider>,
    )

    await waitFor(() => expect(screen.getByText('Staff Engineer')).toBeInTheDocument())

    await user.click(screen.getByText('update context'))

    await waitFor(() => {
      expect(screen.getByText('Principal Engineer')).toBeInTheDocument()
      expect(screen.queryByText('Staff Engineer')).not.toBeInTheDocument()
    })
  })
})
