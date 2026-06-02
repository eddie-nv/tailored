import { createAgentHandler } from '../_lib/sse-handler'
import { CVAgent } from '@tailored/agents/cv'

const handler = createAgentHandler(() => new CVAgent())

export { handler as GET, handler as POST }
