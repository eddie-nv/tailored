import { createAgentHandler } from '../_lib/sse-handler'
import { BatchAgent } from '@tailored/agents/batch'

const handler = createAgentHandler(() => new BatchAgent())

export { handler as GET, handler as POST }
