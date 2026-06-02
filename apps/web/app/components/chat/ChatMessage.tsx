import type { UIMessage } from './ChatPanel'

type Props = {
  message: UIMessage
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 bg-zinc-900 text-white text-sm leading-relaxed break-words"
          role="article"
          aria-label="Your message"
        >
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 items-start" role="article" aria-label="Assistant message">
      {/* Avatar */}
      <div
        className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <span className="text-[10px] font-semibold text-zinc-600">T</span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Step indicator */}
        {message.activeStep && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" aria-hidden="true" />
            <span className="text-[11px] text-zinc-400 font-mono">{message.activeStep}</span>
          </div>
        )}

        {/* Content */}
        <div
          className={[
            'text-sm leading-relaxed text-zinc-800 break-words',
            message.isError ? 'text-red-600' : '',
            message.isStreaming && !message.content ? 'min-h-[1.25rem]' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {message.content ? (
            <span className={message.isStreaming ? 'streaming-cursor' : ''}>
              {message.content}
            </span>
          ) : message.isStreaming ? (
            <span className="inline-flex gap-0.5 items-center h-4">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                  aria-hidden="true"
                />
              ))}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
