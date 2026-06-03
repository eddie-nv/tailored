import { Command } from 'commander'
import { randomUUID } from 'crypto'
import { ScannerAgent } from '@tailored/agents/scanner'
import { validateEnv } from '../utils/env.js'
import { subscribeToStdout } from '../transport/stdout.js'

export const scanCommand = new Command('scan')
  .description('Scan job portals for new openings')
  .option('--limit <n>', 'Maximum jobs to scan per portal', parseInt)
  .option('--json', 'Output JSON instead of formatted terminal output')
  .option('--debug', 'Show event debug output')
  .action(async (opts: { limit?: number; json?: boolean; debug?: boolean }) => {
    validateEnv()

    const agentInput = {
      threadId: `thread-scan-${randomUUID()}`,
      runId: randomUUID(),
      messages: [],
      tools: [],
      context: [],
      state: { limit: opts.limit },
    }

    const agent = new ScannerAgent()
    await subscribeToStdout(agent.run(agentInput), opts)
  })
