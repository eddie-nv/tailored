import { createAgentHandler } from '../_lib/sse-handler'
import { BatchAgent } from '@tailored/agents/batch'

const handler = createAgentHandler(() => new BatchAgent())

export const POST = handler
export const OPTIONS = handler
