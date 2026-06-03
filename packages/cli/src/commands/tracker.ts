import { Command } from 'commander'
import { validateEnv } from '../utils/env.js'
import { prisma } from '../utils/db.js'
import { formatJobTable } from '../utils/table.js'

export const VALID_STATUSES = [
  'new',
  'reviewed',
  'applied',
  'interview',
  'offer',
  'rejected',
  'archived',
] as const

export type JobStatus = (typeof VALID_STATUSES)[number]

export function isValidStatus(s: string): s is JobStatus {
  return (VALID_STATUSES as readonly string[]).includes(s)
}

export const trackerCommand = new Command('tracker').description(
  'View and update job tracking status',
)

trackerCommand
  .command('list')
  .description('List all tracked jobs')
  .option('--status <status>', 'Filter by status')
  .option('--json', 'Output JSON array')
  .action(async (opts: { status?: string; json?: boolean }) => {
    validateEnv()

    const jobs = await prisma.job.findMany({
      where: opts.status ? { status: opts.status } : {},
      orderBy: { createdAt: 'desc' },
    })

    if (opts.json) {
      process.stdout.write(JSON.stringify(jobs) + '\n')
      return
    }

    if (jobs.length === 0) {
      process.stdout.write('No jobs found.\n')
      return
    }

    process.stdout.write(formatJobTable(jobs) + '\n')
  })

trackerCommand
  .command('update')
  .description('Update job status')
  .argument('<jobId>', 'Job ID to update')
  .argument('<status>', `New status (${VALID_STATUSES.join(', ')})`)
  .action(async (jobId: string, status: string) => {
    validateEnv()

    if (!isValidStatus(status)) {
      process.stderr.write(
        `Error: invalid status "${status}". Valid values: ${VALID_STATUSES.join(', ')}\n`,
      )
      process.exit(2)
    }

    await prisma.job.update({ where: { id: jobId }, data: { status } })
    process.stdout.write(`Updated job ${jobId} → ${status}\n`)
  })
