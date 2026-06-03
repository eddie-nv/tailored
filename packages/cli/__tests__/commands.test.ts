import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Observable } from 'rxjs'
import { EventType } from '@ag-ui/core'
import type { BaseEvent } from '@ag-ui/core'
import { formatJobTable } from '../src/utils/table.js'
import { isValidStatus, VALID_STATUSES } from '../src/commands/tracker.js'

vi.mock('ora', () => ({
  default: () => ({
    isSpinning: false,
    start(text?: string) { this.text = text ?? ''; this.isSpinning = true; return this },
    succeed(_text?: string) { this.isSpinning = false; return this },
    fail(_text?: string) { this.isSpinning = false; return this },
    stop() { this.isSpinning = false; return this },
    text: '',
    stream: process.stderr,
  }),
}))

vi.mock('chalk', () => ({
  default: {
    red: (s: string) => s,
    dim: (s: string) => s,
  },
}))

function makeObs(events: BaseEvent[]): Observable<BaseEvent> {
  return new Observable<BaseEvent>((sub) => {
    for (const ev of events) sub.next(ev)
    sub.complete()
  })
}

// ── formatJobTable ─────────────────────────────────────────────────────────────

describe('formatJobTable', () => {
  it('renders header and separator', () => {
    const result = formatJobTable([])
    const lines = result.split('\n')
    expect(lines[0]).toContain('ID')
    expect(lines[0]).toContain('Company')
    expect(lines[0]).toContain('Role')
    expect(lines[0]).toContain('Score')
    expect(lines[0]).toContain('Status')
    expect(lines[0]).toContain('Created')
    expect(lines[1]).toMatch(/^─+$/)
  })

  it('renders a job row with correct columns', () => {
    const jobs = [
      {
        id: 'abc-12345678',
        company: 'Acme Corp',
        role: 'Senior Engineer',
        score: 'A',
        status: 'new',
        createdAt: new Date('2026-01-15T00:00:00Z'),
      },
    ]
    const result = formatJobTable(jobs)
    expect(result).toContain('Acme Corp')
    expect(result).toContain('Senior Engineer')
    expect(result).toContain('A')
    expect(result).toContain('new')
    expect(result).toContain('2026-01-15')
  })

  it('truncates long company and role names', () => {
    const jobs = [
      {
        id: 'abc-12345678',
        company: 'A'.repeat(30),
        role: 'B'.repeat(40),
        score: null,
        status: 'applied',
        createdAt: '2026-01-15T00:00:00Z',
      },
    ]
    const result = formatJobTable(jobs)
    expect(result).toContain('…')
  })

  it('renders – for null score', () => {
    const jobs = [
      {
        id: 'abc-12345678',
        company: 'Corp',
        role: 'Role',
        score: null,
        status: 'new',
        createdAt: new Date('2026-01-15T00:00:00Z'),
      },
    ]
    const result = formatJobTable(jobs)
    expect(result).toContain('–')
  })
})

// ── isValidStatus ──────────────────────────────────────────────────────────────

describe('isValidStatus', () => {
  it('accepts all valid statuses', () => {
    for (const s of VALID_STATUSES) {
      expect(isValidStatus(s)).toBe(true)
    }
  })

  it('rejects unknown statuses', () => {
    expect(isValidStatus('badstatus')).toBe(false)
    expect(isValidStatus('')).toBe(false)
    expect(isValidStatus('pending')).toBe(false)
  })
})

// ── subscribeToStdout CUSTOM events ───────────────────────────────────────────

describe('subscribeToStdout CUSTOM events', () => {
  // Import after mocks are set up
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let subscribeToStdout: (obs: Observable<BaseEvent>, opts?: any) => Promise<void>

  const stdoutWrites: string[] = []
  const stderrWrites: string[] = []

  beforeEach(async () => {
    stdoutWrites.length = 0
    stderrWrites.length = 0
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      stdoutWrites.push(String(chunk))
      return true
    })
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      stderrWrites.push(String(chunk))
      return true
    })
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    const mod = await import('../src/transport/stdout.js')
    subscribeToStdout = mod.subscribeToStdout
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('prints PDF path on pdf-ready CUSTOM event', async () => {
    const obs = makeObs([
      { type: EventType.RUN_STARTED } as BaseEvent,
      {
        type: EventType.CUSTOM,
        name: 'pdf-ready',
        value: { path: '/tmp/resumes/job-123.pdf', filename: 'job-123.pdf' },
      } as BaseEvent,
      { type: EventType.RUN_FINISHED } as BaseEvent,
    ])

    await subscribeToStdout(obs)

    const out = stdoutWrites.join('')
    expect(out).toContain('/tmp/resumes/job-123.pdf')
  })

  it('prints scan summary from RUN_FINISHED interrupt outcome', async () => {
    const obs = makeObs([
      { type: EventType.RUN_STARTED } as BaseEvent,
      {
        type: EventType.RUN_FINISHED,
        outcome: {
          type: 'interrupt',
          interrupts: [{ message: 'Scan complete. Found 5 new jobs.', id: 'x', reason: 'r', metadata: {} }],
        },
      } as BaseEvent,
    ])

    await subscribeToStdout(obs)

    const out = stdoutWrites.join('')
    expect(out).toContain('Scan complete. Found 5 new jobs.')
  })
})
