import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { AddPortalForm } from './AddPortalForm'

function renderForm(onAdd = vi.fn()) {
  return render(
    <MantineProvider>
      <AddPortalForm onAdd={onAdd} />
    </MantineProvider>,
  )
}

describe('AddPortalForm — new optional fields', () => {
  it('renders provider override select', () => {
    renderForm()
    expect(screen.getByLabelText(/provider override/i)).toBeInTheDocument()
  })

  it('API endpoint field is hidden by default', () => {
    renderForm()
    expect(screen.queryByLabelText(/api endpoint/i)).not.toBeInTheDocument()
  })

  it('API endpoint field appears when provider is Greenhouse', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.selectOptions(screen.getByLabelText(/provider override/i), 'Greenhouse')
    expect(screen.getByLabelText(/api endpoint/i)).toBeInTheDocument()
  })

  it('API endpoint field disappears when switching away from Greenhouse', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.selectOptions(screen.getByLabelText(/provider override/i), 'Greenhouse')
    await user.selectOptions(screen.getByLabelText(/provider override/i), 'Ashby')
    expect(screen.queryByLabelText(/api endpoint/i)).not.toBeInTheDocument()
  })

  it('renders notes field', () => {
    renderForm()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
  })

  it('rejects api URL that does not start with https://', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.selectOptions(screen.getByLabelText(/provider override/i), 'Greenhouse')
    await user.type(screen.getByLabelText(/company name/i), 'Test Co')
    await user.type(screen.getByLabelText(/careers url/i), 'https://careers.test.com')
    await user.type(screen.getByLabelText(/api endpoint/i), 'http://boards.greenhouse.io/test')
    await user.click(screen.getByRole('button', { name: /add portal/i }))
    expect(screen.getByText(/must use https/i)).toBeInTheDocument()
  })

  it('submits all five fields on valid input', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderForm(onAdd)

    await user.type(screen.getByLabelText(/company name/i), 'Anthropic')
    await user.type(screen.getByLabelText(/careers url/i), 'https://careers.anthropic.com')
    await user.selectOptions(screen.getByLabelText(/provider override/i), 'Greenhouse')
    await user.type(
      screen.getByLabelText(/api endpoint/i),
      'https://boards-api.greenhouse.io/v1/boards/anthropic',
    )
    await user.type(screen.getByLabelText(/notes/i), 'AI lab')
    await user.click(screen.getByRole('button', { name: /add portal/i }))

    expect(onAdd).toHaveBeenCalledWith({
      name: 'Anthropic',
      url: 'https://careers.anthropic.com',
      provider: 'Greenhouse',
      api: 'https://boards-api.greenhouse.io/v1/boards/anthropic',
      notes: 'AI lab',
    })
  })

  it('submits with null provider and null api when left at auto-detect', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderForm(onAdd)

    await user.type(screen.getByLabelText(/company name/i), 'Linear')
    await user.type(screen.getByLabelText(/careers url/i), 'https://jobs.ashbyhq.com/linear')
    await user.click(screen.getByRole('button', { name: /add portal/i }))

    expect(onAdd).toHaveBeenCalledWith({
      name: 'Linear',
      url: 'https://jobs.ashbyhq.com/linear',
      provider: null,
      api: null,
      notes: null,
    })
  })
})
