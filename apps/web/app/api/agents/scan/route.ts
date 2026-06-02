import { createAgentHandler } from '../_lib/sse-handler'
import { ScannerAgent } from '@tailored/agents/scanner'

const handler = createAgentHandler(() => new ScannerAgent())

export { handler as GET, handler as POST }
