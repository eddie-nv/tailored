import { createAgentHandler } from '../_lib/sse-handler'
import { StubAgent } from './stub-agent'

const handler = createAgentHandler(() => new StubAgent())

export const POST = handler
export const OPTIONS = handler
