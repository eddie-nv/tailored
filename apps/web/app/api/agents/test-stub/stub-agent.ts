import { EventType } from '@ag-ui/core'
import type { RunAgentInput, BaseEvent } from '@ag-ui/core'
import { BaseAgent } from '@tailored/agents'

export class StubAgent extends BaseAgent {
  protected async *runSteps(
    _input: RunAgentInput,
  ): AsyncGenerator<BaseEvent> {
    const messageId = crypto.randomUUID()
    yield {
      type: EventType.TEXT_MESSAGE_START,
      messageId,
      role: 'assistant',
    } as BaseEvent
    yield {
      type: EventType.TEXT_MESSAGE_CONTENT,
      messageId,
      delta: 'Hello from stub agent.',
    } as BaseEvent
    yield {
      type: EventType.TEXT_MESSAGE_END,
      messageId,
    } as BaseEvent
  }
}
