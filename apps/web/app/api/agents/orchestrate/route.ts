import { createAgentHandler } from '../_lib/sse-handler'
import { OrchestratorAgent } from '@tailored/agents/orchestrator'

const handler = createAgentHandler(() => new OrchestratorAgent())

export const POST = handler
export const OPTIONS = handler
