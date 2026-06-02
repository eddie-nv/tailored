import { createAgentHandler } from '../_lib/sse-handler'
import { ScannerAgent } from '@tailored/agents/scanner'

const handler = createAgentHandler(() => new ScannerAgent())

export const POST = handler
export const OPTIONS = handler
