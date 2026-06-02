import { createAgentHandler } from '../_lib/sse-handler'
import { EvaluationAgent } from '@tailored/agents/evaluation'

const handler = createAgentHandler(() => new EvaluationAgent())

export const POST = handler
export const OPTIONS = handler
