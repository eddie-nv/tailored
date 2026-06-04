'use client'

import { Component, type ReactNode } from 'react'
import { Text, Center, Stack, Anchor } from '@mantine/core'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  label?: string
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Something went wrong.'
    return { hasError: true, message }
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <Center h="100%" role="alert" p="xl">
          <Stack align="center" gap="xs" ta="center">
            <Text size="sm" fw={600} c="dimmed">{this.props.label ?? 'Panel error'}</Text>
            <Text size="xs" c="dimmed" maw={280}>{this.state.message}</Text>
            <Anchor component="button" type="button" size="xs" mt="xs" onClick={this.handleReset}>
              Try again
            </Anchor>
          </Stack>
        </Center>
      )
    }

    return this.props.children
  }
}
