import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoleTargetsProvider, useRoleDerivedTitles } from '../app/providers/RoleTargetsProvider'

function TitlesDisplay() {
  const { derivedTitles } = useRoleDerivedTitles()
  return <div data-testid="titles">{derivedTitles.join(',')}</div>
}

function TitlesController() {
  const { derivedTitles, setDerivedTitles } = useRoleDerivedTitles()
  return (
    <div>
      <div data-testid="titles">{derivedTitles.join(',')}</div>
      <button onClick={() => setDerivedTitles(['Staff Engineer', 'Engineering Manager'])}>
        set titles
      </button>
      <button onClick={() => setDerivedTitles([])}>clear</button>
    </div>
  )
}

describe('RoleTargetsProvider', () => {
  it('provides empty derived titles by default', () => {
    render(
      <RoleTargetsProvider>
        <TitlesDisplay />
      </RoleTargetsProvider>,
    )
    expect(screen.getByTestId('titles').textContent).toBe('')
  })

  it('setDerivedTitles updates the context value', async () => {
    const user = userEvent.setup()
    render(
      <RoleTargetsProvider>
        <TitlesController />
      </RoleTargetsProvider>,
    )

    await user.click(screen.getByText('set titles'))
    expect(screen.getByTestId('titles')).toHaveTextContent('Staff Engineer,Engineering Manager')
  })

  it('setDerivedTitles clears to empty array', async () => {
    const user = userEvent.setup()
    render(
      <RoleTargetsProvider>
        <TitlesController />
      </RoleTargetsProvider>,
    )

    await user.click(screen.getByText('set titles'))
    await user.click(screen.getByText('clear'))
    expect(screen.getByTestId('titles').textContent).toBe('')
  })

  it('throws when useRoleDerivedTitles is used outside provider', () => {
    const originalError = console.error
    console.error = () => {}
    expect(() => render(<TitlesDisplay />)).toThrow()
    console.error = originalError
  })

  it('multiple consumers all receive the same value', async () => {
    const user = userEvent.setup()

    function MultiConsumer() {
      const { derivedTitles, setDerivedTitles } = useRoleDerivedTitles()
      return (
        <div>
          <div data-testid="a">{derivedTitles.join(',')}</div>
          <div data-testid="b">{derivedTitles.join(',')}</div>
          <button onClick={() => setDerivedTitles(['Director of Engineering'])}>set</button>
        </div>
      )
    }

    render(
      <RoleTargetsProvider>
        <MultiConsumer />
      </RoleTargetsProvider>,
    )

    await user.click(screen.getByText('set'))
    expect(screen.getByTestId('a')).toHaveTextContent('Director of Engineering')
    expect(screen.getByTestId('b')).toHaveTextContent('Director of Engineering')
  })
})
