import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { JobSourceBadge } from './JobSourceBadge'

function renderBadge(source: string) {
  return render(
    <MantineProvider>
      <JobSourceBadge source={source} />
    </MantineProvider>,
  )
}

describe('JobSourceBadge', () => {
  it('renders "API" badge for source="scan"', () => {
    renderBadge('scan')
    expect(screen.getByText('API')).toBeInTheDocument()
  })

  it('renders "Web" badge for source="search"', () => {
    renderBadge('search')
    expect(screen.getByText('Web')).toBeInTheDocument()
  })

  it('renders nothing for source="direct"', () => {
    renderBadge('direct')
    expect(screen.queryByText('API')).not.toBeInTheDocument()
    expect(screen.queryByText('Web')).not.toBeInTheDocument()
  })

  it('renders nothing for an unrecognised source', () => {
    renderBadge('unknown')
    expect(screen.queryByText('API')).not.toBeInTheDocument()
    expect(screen.queryByText('Web')).not.toBeInTheDocument()
  })
})
