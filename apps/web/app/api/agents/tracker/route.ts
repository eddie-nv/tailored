import { createAgentHandler } from '../_lib/sse-handler'
import { TrackerAgent } from '@tailored/agents/tracker'

const handler = createAgentHandler(() => new TrackerAgent())

export const POST = handler
export const OPTIONS = handler
