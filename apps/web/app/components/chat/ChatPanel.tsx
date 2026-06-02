'use client'

import { useEffect, useRef, useState } from 'react'
import { EventType } from '@ag-ui/core'
import type { BaseEvent } from '@ag-ui/core'
import { useAgUI } from '../../providers/AgUIProvider'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'

export interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  isError?: boolean
  activeStep?: string
}

function toAgUIMessages(messages: UIMessage[]) {
  return messages
    .filter((m) => !m.isStreaming || m.content.length > 0)
    .map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    }))
}

export function ChatPanel() {
  const agUI = useAgUI()
  const agent = agUI?.agent
  const threadId = agUI?.threadId ?? ''
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function submit(text: string) {
    if (!text.trim() || isRunning || !agent) return

    const userMsg: UIMessage = { id: crypto.randomUUID(), role: 'user', content: text }
    const assistantId = crypto.randomUUID()
    const assistantMsg: UIMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setIsRunning(true)

    const allMessages = [...messages, userMsg]

    const events$ = agent!.run({
      threadId,
      runId: crypto.randomUUID(),
      messages: toAgUIMessages(allMessages) as Parameters<typeof agent.run>[0]['messages'],
      tools: [],
      context: [],
      forwardedProps: {},
    })

    subscriptionRef.current = events$.subscribe({
      next(event: BaseEvent) {
        handleEvent(event, assistantId)
      },
      complete() {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false, activeStep: undefined } : m,
          ),
        )
        setIsRunning(false)
      },
      error() {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, isStreaming: false, isError: true, content: m.content || 'An error occurred.' }
              : m,
          ),
        )
        setIsRunning(false)
      },
    })
  }

  function handleEvent(event: BaseEvent, assistantId: string) {
    const e = event as Record<string, unknown>
    switch (event.type) {
      case EventType.TEXT_MESSAGE_CONTENT:
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content + (e['delta'] as string) }
              : m,
          ),
        )
        break

      case EventType.STEP_STARTED:
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, activeStep: e['stepName'] as string } : m,
          ),
        )
        break

      case EventType.STEP_FINISHED:
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, activeStep: undefined } : m,
          ),
        )
        break

      case EventType.RUN_ERROR:
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  isStreaming: false,
                  isError: true,
                  content: `Error: ${(e['message'] as string) ?? 'Unknown error'}`,
                }
              : m,
          ),
        )
        setIsRunning(false)
        break
    }
  }

  const isEmpty = messages.length === 0

  return (
    <>
      {/* Message list */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center">
              <span className="text-white text-base">T</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-800">What are you looking for today?</p>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Paste a job URL, ask me to scan portals, or update your profile.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Input */}
      <ChatInput onSubmit={submit} isLoading={isRunning} />
    </>
  )
}
