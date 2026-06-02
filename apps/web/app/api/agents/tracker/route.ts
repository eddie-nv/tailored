import { createAgentHandler } from '../_lib/sse-handler'
import { TrackerAgent } from '@tailored/agents/tracker'

const handler = createAgentHandler(() => new TrackerAgent())

export { handler as GET, handler as POST }
