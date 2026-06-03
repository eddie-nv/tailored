import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Observable } from 'rxjs'
import { EventType } from '@ag-ui/core'
import type { BaseEvent } from '@ag-ui/core'
import { subscribeToStdout } from '../src/transport/stdout.js'

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

describe('subscribeToStdout', () => {
  const stdoutWrites: string[] = []
  const stderrWrites: string[] = []

  beforeEach(() => {
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
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls process.exit(1) on RUN_ERROR', async () => {
    const obs = makeObs([
      { type: EventType.RUN_ERROR, message: 'agent failed' } as BaseEvent,
      { type: EventType.RUN_FINISHED } as BaseEvent,
    ])

    await subscribeToStdout(obs)

    expect(process.exit).toHaveBeenCalledWith(1)
  })

  it('writes TEXT_MESSAGE_CONTENT deltas to stdout in order', async () => {
    const obs = makeObs([
      { type: EventType.RUN_STARTED } as BaseEvent,
      { type: EventType.TEXT_MESSAGE_START, messageId: 'm1', role: 'assistant' } as BaseEvent,
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: 'm1', delta: 'Hello' } as BaseEvent,
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: 'm1', delta: ', world' } as BaseEvent,
      { type: EventType.TEXT_MESSAGE_END, messageId: 'm1' } as BaseEvent,
      { type: EventType.RUN_FINISHED } as BaseEvent,
    ])

    await subscribeToStdout(obs)

    expect(stdoutWrites).toContain('Hello')
    expect(stdoutWrites).toContain(', world')
    expect(stdoutWrites.indexOf('Hello')).toBeLessThan(stdoutWrites.indexOf(', world'))
  })

  it('buffers text and outputs JSON when --json flag is set', async () => {
    const obs = makeObs([
      { type: EventType.RUN_STARTED } as BaseEvent,
      { type: EventType.TEXT_MESSAGE_START, messageId: 'm1', role: 'assistant' } as BaseEvent,
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: 'm1', delta: 'Part A' } as BaseEvent,
      { type: EventType.TEXT_MESSAGE_CONTENT, messageId: 'm1', delta: ' Part B' } as BaseEvent,
      { type: EventType.TEXT_MESSAGE_END, messageId: 'm1' } as BaseEvent,
      { type: EventType.RUN_FINISHED } as BaseEvent,
    ])

    await subscribeToStdout(obs, { json: true })

    const combined = stdoutWrites.join('')
    const parsed = JSON.parse(combined) as { report: string }
    expect(parsed.report).toBe('Part A Part B')
  })
})
