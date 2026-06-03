import { Command } from 'commander'
import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import chalk from 'chalk'
import { EvaluationAgent } from '@tailored/agents/evaluation'
import { validateEnv } from '../utils/env.js'
import { prisma } from '../utils/db.js'
import { formatJobTable } from '../utils/table.js'
import type { BaseEvent } from '@ag-ui/core'

class Semaphore {
  private queue: Array<() => void> = []
  private running = 0

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.max) {
      this.running++
      return
    }
    return new Promise((resolve) => this.queue.push(resolve))
  }

  release(): void {
    const next = this.queue.shift()
    if (next) {
      next()
    } else {
      this.running--
    }
  }
}

export function parseBatchFile(path: string): string[] {
  return readFileSync(path, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
}

export const batchCommand = new Command('batch')
  .description('Evaluate multiple jobs from a URL file')
  .argument('<file>', 'Path to newline-separated URL file (one URL per line; # lines ignored)')
  .option('--concurrency <n>', 'Maximum parallel evaluations (overrides BATCH_CONCURRENCY env)', parseInt)
  .option('--json', 'Output JSON array instead of formatted table')
  .option('--debug', 'Show per-job event debug output')
  .action(async (file: string, opts: { concurrency?: number; json?: boolean; debug?: boolean }) => {
    validateEnv()

    let urls: string[]
    try {
      urls = parseBatchFile(file)
    } catch {
      process.stderr.write(`Error: cannot read file "${file}"\n`)
      process.exit(2)
    }

    if (urls.length === 0) {
      process.stderr.write('Error: no URLs found in file\n')
      process.exit(2)
    }

    if (!opts.json) {
      process.stdout.write(`Found ${urls.length} URL${urls.length === 1 ? '' : 's'} — starting batch evaluation\n\n`)
    }

    const jobs = await Promise.all(
      urls.map((url) =>
        prisma.job.create({
          data: { company: 'Evaluating...', role: 'Evaluating...', url, source: 'direct', status: 'new' },
        }),
      ),
    )

    const CONCURRENCY = opts.concurrency ?? parseInt(process.env['BATCH_CONCURRENCY'] ?? '3', 10)
    const sem = new Semaphore(CONCURRENCY)
    let completed = 0
    const total = jobs.length

    const results = await Promise.all(
      jobs.map(async (job) => {
        await sem.acquire()
        try {
          await new Promise<void>((resolve, reject) => {
            const agent = new EvaluationAgent()
            agent
              .run({
                threadId: `thread-batch-${job.id}`,
                runId: randomUUID(),
                messages: [],
                tools: [],
                context: [],
                state: { pendingJobId: job.id, jobDescription: job.url ?? '' },
              })
              .subscribe({
                next(event: BaseEvent) {
                  if (opts.debug) {
                    process.stderr.write(chalk.dim(`[job:${job.id.slice(0, 8)}] ${event.type}\n`))
                  }
                },
                error: reject,
                complete: resolve,
              })
          })

          completed++
          const updated = await prisma.job.findUniqueOrThrow({ where: { id: job.id } })
          if (!opts.json) {
            const scoreStr = updated.score ? chalk.dim(` (${updated.score})`) : ''
            process.stdout.write(
              chalk.green(`[${completed}/${total}]`) +
                ` ✓ ${updated.company} — ${updated.role}${scoreStr}\n`,
            )
          }
          return updated
        } catch (err) {
          completed++
          const msg = err instanceof Error ? err.message : 'unknown error'
          process.stderr.write(
            chalk.red(`[${completed}/${total}]`) + ` ✗ ${job.url ?? job.id} — ${msg}\n`,
          )
          return null
        } finally {
          sem.release()
        }
      }),
    )

    const done = results.filter((r): r is NonNullable<typeof r> => r !== null)

    if (opts.json) {
      process.stdout.write(JSON.stringify(done) + '\n')
    } else {
      process.stdout.write('\n')
      if (done.length > 0) {
        process.stdout.write(formatJobTable(done) + '\n')
      }
    }
  })
