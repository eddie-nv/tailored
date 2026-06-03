import ora from 'ora'
import chalk from 'chalk'
import { EventType } from '@ag-ui/core'
import type { BaseEvent } from '@ag-ui/core'
import { Observable } from 'rxjs'

export interface StdoutTransportOptions {
  json?: boolean
  debug?: boolean
}

export function subscribeToStdout(
  obs: Observable<BaseEvent>,
  opts: StdoutTransportOptions = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const spinner = ora({ stream: process.stderr })
    const textBuffer: string[] = []
    let hadError = false
    let streamingActive = false

    spinner.start('Starting…')

    obs.subscribe({
      next(event: BaseEvent) {
        const type = event.type
        const ev = event as Record<string, unknown>

        switch (type) {
          case EventType.RUN_STARTED:
            spinner.text = 'Running…'
            break

          case EventType.STEP_STARTED: {
            const stepName = (ev['stepName'] as string | undefined) ?? 'processing'
            if (spinner.isSpinning) {
              spinner.text = stepName
            } else {
              spinner.start(stepName)
            }
            break
          }

          case EventType.STEP_FINISHED: {
            const stepName = (ev['stepName'] as string | undefined) ?? 'done'
            if (!streamingActive) {
              spinner.succeed(stepName)
            }
            break
          }

          case EventType.TEXT_MESSAGE_START:
            streamingActive = true
            if (!opts.json) {
              spinner.stop()
            }
            break

          case EventType.TEXT_MESSAGE_CONTENT: {
            const delta = (ev['delta'] as string | undefined) ?? ''
            if (opts.json) {
              textBuffer.push(delta)
            } else {
              process.stdout.write(delta)
            }
            break
          }

          case EventType.TEXT_MESSAGE_END:
            if (!opts.json) {
              process.stdout.write('\n')
            }
            break

          case EventType.RUN_ERROR: {
            hadError = true
            const message = (ev['message'] as string | undefined) ?? 'Unknown error'
            spinner.fail(chalk.red('Error: ') + message)
            process.stderr.write(message + '\n')
            process.exit(1)
            break
          }

          case EventType.RUN_FINISHED: {
            if (!hadError && !streamingActive) {
              spinner.succeed('Done')
            } else if (spinner.isSpinning) {
              spinner.stop()
            }
            // Print interrupt message (e.g., scan summary) if present
            const outcome = ev['outcome'] as { type: string; interrupts?: Array<{ message: string }> } | undefined
            if (outcome?.type === 'interrupt' && outcome.interrupts?.[0]) {
              process.stdout.write('\n' + outcome.interrupts[0].message + '\n')
            }
            break
          }

          case EventType.CUSTOM: {
            const name = ev['name'] as string | undefined
            const value = ev['value'] as Record<string, unknown> | undefined
            if (name === 'pdf-ready' && value) {
              process.stdout.write('\nPDF saved to: ' + String(value['path'] ?? value['filename']) + '\n')
            } else if (name === 'scan-progress-init' && value) {
              spinner.text = `Scanning 0/${String(value['total'])} platforms…`
            } else if (name === 'scan-progress-update' && value) {
              spinner.text = `Scanned ${String(value['done'])}/${String(value['total'] ?? '?')} — ${String(value['found'])} jobs found (${String(value['platform'])})`
            } else if (opts.debug) {
              process.stderr.write(chalk.dim(`[custom] ${name ?? 'unknown'}\n`))
            }
            break
          }

          case EventType.TOOL_CALL_START:
          case EventType.TOOL_CALL_ARGS:
          case EventType.TOOL_CALL_END:
            if (opts.debug) {
              process.stderr.write(chalk.dim(`[tool] ${type}\n`))
            }
            break

          default:
            if (opts.debug) {
              process.stderr.write(chalk.dim(`[event] ${type}\n`))
            }
        }
      },

      error(err: unknown) {
        spinner.fail(chalk.red('Unexpected error'))
        reject(err instanceof Error ? err : new Error(String(err)))
      },

      complete() {
        if (opts.json && textBuffer.length > 0) {
          process.stdout.write(JSON.stringify({ report: textBuffer.join('') }) + '\n')
        }
        resolve()
      },
    })
  })
}
