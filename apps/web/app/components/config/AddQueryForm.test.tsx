import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AddQueryForm } from './AddQueryForm'

function renderForm(onAdd = vi.fn()) {
  return render(
    <MantineProvider>
      <AddQueryForm onAdd={onAdd} />
    </MantineProvider>,
  )
}

describe('AddQueryForm', () => {
  it('renders name and query fields', () => {
    renderForm()
    expect(screen.getByLabelText(/query name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/search query/i)).toBeInTheDocument()
  })

  it('submits with name and query, then clears fields on success', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderForm(onAdd)

    await user.type(screen.getByLabelText(/query name/i), 'AI jobs')
    await user.type(screen.getByLabelText(/search query/i), 'site:ashbyhq.com AI engineer')
    await user.click(screen.getByRole('button', { name: /add query/i }))

    expect(onAdd).toHaveBeenCalledWith({
      name: 'AI jobs',
      query: 'site:ashbyhq.com AI engineer',
    })
    expect(screen.getByLabelText(/query name/i)).toHaveValue('')
    expect(screen.getByLabelText(/search query/i)).toHaveValue('')
  })

  it('shows an error when name is empty', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/search query/i), 'site:ashbyhq.com AI')
    await user.click(screen.getByRole('button', { name: /add query/i }))

    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
  })

  it('shows an error when query is empty', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/query name/i), 'Test')
    await user.click(screen.getByRole('button', { name: /add query/i }))

    expect(screen.getByText(/query is required/i)).toBeInTheDocument()
  })

  it('shows a character counter on the query field', () => {
    renderForm()
    expect(screen.getByText(/0 \/ 500/i)).toBeInTheDocument()
  })

  it('updates character counter as user types', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/search query/i), 'hello')
    expect(screen.getByText(/5 \/ 500/i)).toBeInTheDocument()
  })

  it('disables submit when query exceeds 500 characters', () => {
    renderForm()
    fireEvent.change(screen.getByLabelText(/search query/i), { target: { value: 'a'.repeat(501) } })
    expect(screen.getByRole('button', { name: /add query/i })).toBeDisabled()
  })
})
