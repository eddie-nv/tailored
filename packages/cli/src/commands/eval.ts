import { Command } from 'commander'
import { randomUUID } from 'crypto'
import { EvaluationAgent } from '@tailored/agents/evaluation'
import { validateEnv } from '../utils/env.js'
import { prisma } from '../utils/db.js'
import { subscribeToStdout } from '../transport/stdout.js'

export const evalCommand = new Command('eval')
  .description('Evaluate a job posting')
  .argument('<input>', 'Job URL or raw job description text')
  .option('--json', 'Output JSON instead of formatted terminal output')
  .option('--debug', 'Show tool call and event debug output')
  .action(async (input: string, opts: { json?: boolean; debug?: boolean }) => {
    validateEnv()

    const isUrl = input.startsWith('http://') || input.startsWith('https://')

    const job = await prisma.job.create({
      data: {
        company: 'Unknown',
        role: 'Unknown',
        url: isUrl ? input : null,
        source: 'direct',
        status: 'new',
      },
    })

    const agentInput = {
      threadId: `thread-${job.id}`,
      runId: randomUUID(),
      messages: [],
      tools: [],
      context: [],
      state: {
        pendingJobId: job.id,
        jobDescription: input,
      },
    }

    const agent = new EvaluationAgent()
    await subscribeToStdout(agent.run(agentInput), opts)

    process.stderr.write(`\nJob ID: ${job.id}\n`)
  })
