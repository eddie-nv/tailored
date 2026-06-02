import Anthropic from '@anthropic-ai/sdk'
import { EventType } from '@ag-ui/core'
import type { BaseEvent } from '@ag-ui/core'
import { randomUUID } from 'crypto'

export interface TransportOptions {
  runId: string
  threadId: string
}

export async function* claudeStreamToEvents(
  stream: AsyncIterable<Anthropic.RawMessageStreamEvent>,
  _opts: TransportOptions,
): AsyncGenerator<BaseEvent> {
  const messageId = randomUUID()
  let activeToolCallId: string | null = null
  let activeToolName: string | null = null
  let activeBlockIndex: number | null = null
  let activeBlockType: 'text' | 'tool_use' | null = null

  yield {
    type: EventType.TEXT_MESSAGE_START,
    messageId,
    role: 'assistant',
  } as BaseEvent

  for await (const event of stream) {
    switch (event.type) {
      case 'content_block_start': {
        activeBlockIndex = event.index
        if (event.content_block.type === 'text') {
          activeBlockType = 'text'
        } else if (event.content_block.type === 'tool_use') {
          activeBlockType = 'tool_use'
          activeToolCallId = event.content_block.id
          activeToolName = event.content_block.name
          yield {
            type: EventType.TOOL_CALL_START,
            toolCallId: activeToolCallId,
            toolCallName: activeToolName,
            parentMessageId: messageId,
          } as BaseEvent
        }
        break
      }

      case 'content_block_delta': {
        if (activeBlockType === 'text' && event.delta.type === 'text_delta') {
          yield {
            type: EventType.TEXT_MESSAGE_CONTENT,
            messageId,
            delta: event.delta.text,
          } as BaseEvent
        } else if (
          activeBlockType === 'tool_use' &&
          event.delta.type === 'input_json_delta' &&
          activeToolCallId
        ) {
          yield {
            type: EventType.TOOL_CALL_ARGS,
            toolCallId: activeToolCallId,
            delta: event.delta.partial_json,
          } as BaseEvent
        }
        break
      }

      case 'content_block_stop': {
        if (activeBlockIndex === event.index) {
          if (activeBlockType === 'text') {
            yield {
              type: EventType.TEXT_MESSAGE_END,
              messageId,
            } as BaseEvent
          } else if (activeBlockType === 'tool_use' && activeToolCallId) {
            yield {
              type: EventType.TOOL_CALL_END,
              toolCallId: activeToolCallId,
            } as BaseEvent
          }
          activeBlockType = null
          activeBlockIndex = null
          activeToolCallId = null
          activeToolName = null
        }
        break
      }

      // message_start, message_delta, message_stop are lifecycle events — no AG-UI mapping needed here
    }
  }
}
