import { Command } from 'commander'
import { evalCommand } from './commands/eval.js'
import { scanCommand } from './commands/scan.js'
import { cvCommand } from './commands/cv.js'
import { trackerCommand } from './commands/tracker.js'
import { batchCommand } from './commands/batch.js'
import { completionsCommand } from './commands/completions.js'

const program = new Command()
  .name('tailored')
  .description('AI-powered job search assistant')
  .version('0.1.0')

program.addCommand(evalCommand)
program.addCommand(scanCommand)
program.addCommand(cvCommand)
program.addCommand(trackerCommand)
program.addCommand(batchCommand)
program.addCommand(completionsCommand)
program.parse()
