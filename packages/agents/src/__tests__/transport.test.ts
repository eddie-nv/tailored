import { describe, it, expect } from 'vitest'
import { EventType } from '@ag-ui/core'
import type { BaseEvent } from '@ag-ui/core'
import type Anthropic from '@anthropic-ai/sdk'
import { claudeStreamToEvents } from '../shared/transport'

const opts = { runId: 'run-1', threadId: 'thread-1' }

async function collect(gen: AsyncGenerator<BaseEvent>): Promise<BaseEvent[]> {
  const events: BaseEvent[] = []
  for await (const e of gen) events.push(e)
  return events
}

// Minimal fixtures cast to Anthropic types — we only test the fields our transport uses
type StreamEvent = Anthropic.RawMessageStreamEvent

function* makeTextStream(texts: string[]): Iterable<StreamEvent> {
  yield { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } as StreamEvent extends { content_block: infer B } ? B : never } as StreamEvent
  for (const text of texts) {
    yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } } as StreamEvent
  }
  yield { type: 'content_block_stop', index: 0 } as StreamEvent
}

function* makeToolStream(id: string, name: string, chunks: string[]): Iterable<StreamEvent> {
  yield {
    type: 'content_block_start',
    index: 0,
    content_block: { type: 'tool_use', id, name, input: {} } as StreamEvent extends { content_block: infer B } ? B : never,
  } as StreamEvent
  for (const chunk of chunks) {
    yield {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'input_json_delta', partial_json: chunk },
    } as StreamEvent
  }
  yield { type: 'content_block_stop', index: 0 } as StreamEvent
}

async function* toAsync(iter: Iterable<StreamEvent>): AsyncGenerator<StreamEvent> {
  for (const v of iter) yield v
}

describe('claudeStreamToEvents', () => {
  it('emits TEXT_MESSAGE_START before any text content', async () => {
    const events = await collect(claudeStreamToEvents(toAsync(makeTextStream(['hi'])), opts))
    expect(events[0]?.type).toBe(EventType.TEXT_MESSAGE_START)
  })

  it('emits one TEXT_MESSAGE_CONTENT per text delta', async () => {
    const events = await collect(
      claudeStreamToEvents(toAsync(makeTextStream(['A', 'B', 'C'])), opts),
    )
    const content = events.filter((e) => e.type === EventType.TEXT_MESSAGE_CONTENT)
    expect(content).toHaveLength(3)
    expect((content[0] as unknown as { delta: string }).delta).toBe('A')
    expect((content[2] as unknown as { delta: string }).delta).toBe('C')
  })

  it('emits TEXT_MESSAGE_END after text block closes', async () => {
    const events = await collect(claudeStreamToEvents(toAsync(makeTextStream(['x'])), opts))
    expect(events.some((e) => e.type === EventType.TEXT_MESSAGE_END)).toBe(true)
  })

  it('emits TOOL_CALL_START with correct id and name', async () => {
    const events = await collect(
      claudeStreamToEvents(toAsync(makeToolStream('tc-1', 'search', [])), opts),
    )
    const start = events.find((e) => e.type === EventType.TOOL_CALL_START) as unknown as
      | { toolCallId: string; toolCallName: string }
      | undefined
    expect(start?.toolCallId).toBe('tc-1')
    expect(start?.toolCallName).toBe('search')
  })

  it('emits TOOL_CALL_ARGS for each json chunk', async () => {
    const events = await collect(
      claudeStreamToEvents(toAsync(makeToolStream('tc-2', 'fn', ['{"a":', '"b"}'])), opts),
    )
    const args = events.filter((e) => e.type === EventType.TOOL_CALL_ARGS)
    expect(args).toHaveLength(2)
    expect((args[0] as unknown as { delta: string }).delta).toBe('{"a":')
  })

  it('emits TOOL_CALL_END after tool block closes', async () => {
    const events = await collect(
      claudeStreamToEvents(toAsync(makeToolStream('tc-3', 'fn', [])), opts),
    )
    expect(events.some((e) => e.type === EventType.TOOL_CALL_END)).toBe(true)
  })

  it('handles text and tool blocks in sequence', async () => {
    async function* mixed(): AsyncGenerator<StreamEvent> {
      yield* toAsync(makeTextStream(['hello']))
      yield* toAsync(makeToolStream('tc-4', 'lookup', ['{}']))
    }
    const events = await collect(claudeStreamToEvents(mixed(), opts))
    const types = events.map((e) => e.type)
    expect(types).toContain(EventType.TEXT_MESSAGE_START)
    expect(types).toContain(EventType.TEXT_MESSAGE_END)
    expect(types).toContain(EventType.TOOL_CALL_START)
    expect(types).toContain(EventType.TOOL_CALL_END)
  })
})
