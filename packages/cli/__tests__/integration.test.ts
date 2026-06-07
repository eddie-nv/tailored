import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { execSync } from 'child_process'
import { existsSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'

// ── Test DB setup ─────────────────────────────────────────────────────────────
// vi.hoisted runs before ES module imports are resolved, so only process globals
// and literals are safe here — no imported functions like join().

const { TEST_DB_PATH, TEST_DB_URL } = vi.hoisted(() => {
  const p = `${process.cwd()}/__tests__/test-integration.db`
  return { TEST_DB_PATH: p, TEST_DB_URL: `file:${p}` }
})

// Mock db module with a real PrismaClient pointing at the test DB.
// All CLI commands that import ../src/utils/db.js use this instance,
// so test assertions and command writes share the same DB without touching dev.db.
vi.mock('../src/utils/db.js', async () => {
  const { PrismaClient } = await import('@prisma/client')
  return { prisma: new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } }) }
})

vi.mock('../src/utils/env.js', () => ({ validateEnv: vi.fn() }))

// Mock EvaluationAgent to avoid real Anthropic API calls in batch tests.
// The mock agent completes immediately without mutating the DB job row.
vi.mock('@tailored/agents/evaluation', async () => {
  const { Observable } = await import('rxjs')
  return {
    EvaluationAgent: class {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      run(): any { return new Observable((sub) => { sub.complete() }) }
    },
  }
})

// ── Imports (resolved after mocks are hoisted) ────────────────────────────────

import { prisma } from '../src/utils/db.js'
import { parseBatchFile } from '../src/commands/batch.js'
import { completionsCommand } from '../src/commands/completions.js'
import { trackerCommand } from '../src/commands/tracker.js'
import type { PrismaClient } from '@prisma/client'

const db = prisma as PrismaClient

// ── DB lifecycle ──────────────────────────────────────────────────────────────

beforeAll(() => {
  const prismaBin = join(process.cwd(), 'node_modules', '.bin', 'prisma')
  const schemaPath = join(process.cwd(), '..', 'db', 'prisma', 'schema.prisma')
  execSync(
    `"${prismaBin}" db push --schema="${schemaPath}" --skip-generate`,
    { env: { ...process.env, DATABASE_URL: TEST_DB_URL }, stdio: 'pipe' },
  )
}, 30000)

afterAll(async () => {
  await db.$disconnect()
  if (existsSync(TEST_DB_PATH)) rmSync(TEST_DB_PATH)
})

// ── parseBatchFile ────────────────────────────────────────────────────────────

describe('parseBatchFile', () => {
  const tmpFile = join(process.cwd(), '__tests__', 'tmp-batch.txt')

  afterEach(() => {
    if (existsSync(tmpFile)) rmSync(tmpFile)
  })

  it('parses plain URLs', () => {
    writeFileSync(tmpFile, 'https://example.com/job1\nhttps://example.com/job2\n')
    expect(parseBatchFile(tmpFile)).toEqual([
      'https://example.com/job1',
      'https://example.com/job2',
    ])
  })

  it('strips blank lines and comment lines', () => {
    writeFileSync(tmpFile, '# comment\nhttps://example.com/job1\n\n  # another\nhttps://example.com/job2\n')
    expect(parseBatchFile(tmpFile)).toEqual([
      'https://example.com/job1',
      'https://example.com/job2',
    ])
  })

  it('returns empty array for a file with only comments', () => {
    writeFileSync(tmpFile, '# just a comment\n')
    expect(parseBatchFile(tmpFile)).toEqual([])
  })

  it('throws when file does not exist', () => {
    expect(() => parseBatchFile('/non/existent/path.txt')).toThrow()
  })
})

// ── completions ───────────────────────────────────────────────────────────────

describe('completions command', () => {
  const output: string[] = []
  let writeSpy: ReturnType<typeof vi.spyOn>

  beforeAll(() => {
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      output.push(String(chunk))
      return true
    })
  })

  afterAll(() => {
    writeSpy.mockRestore()
  })

  afterEach(() => { output.length = 0 })

  it('bash output references all subcommands', () => {
    completionsCommand.parse(['bash'], { from: 'user' })
    const src = output.join('')
    expect(src).toContain('eval')
    expect(src).toContain('scan')
    expect(src).toContain('tracker')
    expect(src).toContain('batch')
    expect(src).toContain('completions')
  })

  it('zsh output has #compdef directive', () => {
    completionsCommand.parse(['zsh'], { from: 'user' })
    expect(output.join('')).toContain('#compdef tailored')
  })

  it('fish output references all subcommands', () => {
    completionsCommand.parse(['fish'], { from: 'user' })
    const src = output.join('')
    expect(src).toContain('eval')
    expect(src).toContain('tracker')
    expect(src).toContain('batch')
  })

  it('exits 2 for unknown shell', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    const stderrOutput: string[] = []
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation((c) => {
      stderrOutput.push(String(c))
      return true
    })

    completionsCommand.parse(['powershell'], { from: 'user' })

    expect(exitSpy).toHaveBeenCalledWith(2)
    expect(stderrOutput.join('')).toContain('powershell')

    exitSpy.mockRestore()
    stderrSpy.mockRestore()
  })
})

// ── tracker ↔ DB contract ─────────────────────────────────────────────────────

describe('tracker ↔ DB contract', () => {
  const stdoutWrites: string[] = []
  let writeSpy: ReturnType<typeof vi.spyOn>

  beforeAll(() => {
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      stdoutWrites.push(String(chunk))
      return true
    })
  })

  afterAll(() => {
    writeSpy.mockRestore()
  })

  afterEach(async () => {
    stdoutWrites.length = 0
    await db.job.deleteMany()
  })

  it('tracker list shows a job written directly to the DB', async () => {
    await db.job.create({
      data: {
        company: 'Anthropic',
        role: 'Staff Engineer',
        url: 'https://anthropic.com/careers/staff-eng',
        source: 'direct',
        status: 'new',
      },
    })

    await trackerCommand.parseAsync(['list'], { from: 'user' })

    const out = stdoutWrites.join('')
    expect(out).toContain('Anthropic')
    expect(out).toContain('Staff Engineer')
  })

  it('tracker list shows "No jobs found." when DB is empty', async () => {
    await trackerCommand.parseAsync(['list'], { from: 'user' })
    expect(stdoutWrites.join('')).toContain('No jobs found.')
  })

  it('tracker update writes new status to DB', async () => {
    const job = await db.job.create({
      data: { company: 'Stripe', role: 'Backend Eng', source: 'direct', status: 'new' },
    })

    await trackerCommand.parseAsync(['update', job.id, 'applied'], { from: 'user' })

    const updated = await db.job.findUnique({ where: { id: job.id } })
    expect(updated?.status).toBe('applied')
  })

  it('dual-mode contract: externally written job is visible via tracker list', async () => {
    // Simulates the web frontend creating a job in the shared DB
    await db.job.create({
      data: { company: 'Linear', role: 'Product Engineer', source: 'direct', status: 'new' },
    })

    await trackerCommand.parseAsync(['list'], { from: 'user' })

    const out = stdoutWrites.join('')
    expect(out).toContain('Linear')
    expect(out).toContain('Product Engineer')
  })
})
