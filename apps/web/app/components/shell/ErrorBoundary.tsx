'use client'

import { Component, type ReactNode } from 'react'

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
        <div
          role="alert"
          className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center"
        >
          <p className="text-sm font-semibold text-zinc-300">{this.props.label ?? 'Panel error'}</p>
          <p className="text-xs text-zinc-500 max-w-xs">{this.state.message}</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
