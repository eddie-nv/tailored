import { Command } from 'commander'
import { randomUUID } from 'crypto'
import { CVAgent } from '@tailored/agents/cv'
import { validateEnv } from '../utils/env.js'
import { prisma } from '../utils/db.js'
import { subscribeToStdout } from '../transport/stdout.js'

export const cvCommand = new Command('cv')
  .description('Generate a tailored CV PDF for a job')
  .argument('<jobId>', 'Job ID to generate CV for')
  .option('--template <default|minimal|dense>', 'CV template variant', 'default')
  .option('--json', 'Output JSON instead of formatted terminal output')
  .option('--debug', 'Show event debug output')
  .action(async (jobId: string, opts: { template?: string; json?: boolean; debug?: boolean }) => {
    validateEnv()

    await prisma.job.findUniqueOrThrow({ where: { id: jobId } }).catch(() => {
      process.stderr.write(`Error: job "${jobId}" not found\n`)
      process.exit(2)
    })

    const agentInput = {
      threadId: `thread-cv-${jobId}`,
      runId: randomUUID(),
      messages: [],
      tools: [],
      context: [],
      state: { jobId, template: opts.template },
    }

    const agent = new CVAgent()
    await subscribeToStdout(agent.run(agentInput), opts)
  })
