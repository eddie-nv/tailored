import { Command } from 'commander'

const CMDS = ['eval', 'scan', 'cv', 'tracker', 'batch', 'completions', 'help']
const TRACKER_CMDS = ['list', 'update', 'help']
const STATUSES = ['new', 'reviewed', 'applied', 'interview', 'offer', 'rejected', 'archived']
const SHELLS = ['bash', 'zsh', 'fish']

function bashCompletion(): string {
  return `# tailored bash completion
# Usage: source <(node packages/cli/dist/index.cjs completions bash)
# Or add to ~/.bashrc: source <(tailored completions bash)

_tailored_completion() {
  local cur prev
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  local cmds="${CMDS.join(' ')}"
  local tracker_cmds="${TRACKER_CMDS.join(' ')}"
  local statuses="${STATUSES.join(' ')}"
  local shells="${SHELLS.join(' ')}"

  case "\${COMP_WORDS[1]}" in
    tracker)
      case "$prev" in
        tracker)
          COMPREPLY=( $(compgen -W "$tracker_cmds" -- "$cur") )
          return ;;
        update)
          if [[ \${COMP_CWORD} -ge 4 ]]; then
            COMPREPLY=( $(compgen -W "$statuses" -- "$cur") )
          fi
          return ;;
      esac
      ;;
    batch)
      COMPREPLY=( $(compgen -f -- "$cur") )
      return ;;
    completions)
      COMPREPLY=( $(compgen -W "$shells" -- "$cur") )
      return ;;
  esac

  if [[ \${COMP_CWORD} -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "$cmds" -- "$cur") )
  fi
}

complete -F _tailored_completion tailored
`
}

function zshCompletion(): string {
  return `#compdef tailored
# tailored zsh completion
# Usage: tailored completions zsh > ~/.zsh/completions/_tailored
# Then ensure ~/.zsh/completions is on your fpath.

_tailored() {
  local context state line
  typeset -A opt_args

  local -a commands=(
    'eval:Evaluate a job posting'
    'scan:Scan job portals for new openings'
    'cv:Generate a tailored CV PDF for a job'
    'tracker:View and update job tracking status'
    'batch:Evaluate multiple jobs from a URL file'
    'completions:Generate shell completion script'
    'help:Display help for a command'
  )

  local -a tracker_commands=(
    'list:List all tracked jobs'
    'update:Update job status'
    'help:Display help for a command'
  )

  local -a statuses=(${STATUSES.join(' ')})
  local -a shells=(${SHELLS.join(' ')})

  _arguments -C \\
    '(-h --help)'{-h,--help}'[Show help]' \\
    '(-V --version)'{-V,--version}'[Show version]' \\
    '1: :->command' \\
    '*: :->args'

  case $state in
    command)
      _describe 'tailored command' commands
      ;;
    args)
      case $words[2] in
        tracker)
          if [[ \${#words} -eq 3 ]]; then
            _describe 'tracker subcommand' tracker_commands
          elif [[ $words[3] == update && \${#words} -ge 5 ]]; then
            _describe 'job status' statuses
          fi
          ;;
        batch)
          _files
          ;;
        completions)
          _describe 'shell' shells
          ;;
        eval|cv)
          ;;
        scan)
          _arguments '--limit[Maximum jobs per portal]:number:'
          ;;
      esac
      ;;
  esac
}

_tailored "$@"
`
}

function fishCompletion(): string {
  const noSubcmd = 'not __fish_seen_subcommand_from ' + CMDS.join(' ')
  return `# tailored fish completion
# Usage: tailored completions fish > ~/.config/fish/completions/tailored.fish

complete -c tailored -f

# Top-level subcommands
complete -c tailored -n '${noSubcmd}' -a eval        -d 'Evaluate a job posting'
complete -c tailored -n '${noSubcmd}' -a scan        -d 'Scan job portals for new openings'
complete -c tailored -n '${noSubcmd}' -a cv          -d 'Generate a tailored CV PDF for a job'
complete -c tailored -n '${noSubcmd}' -a tracker     -d 'View and update job tracking status'
complete -c tailored -n '${noSubcmd}' -a batch       -d 'Evaluate multiple jobs from a URL file'
complete -c tailored -n '${noSubcmd}' -a completions -d 'Generate shell completion script'

# tracker subcommands
complete -c tailored -n '__fish_seen_subcommand_from tracker' -a list   -d 'List all tracked jobs'
complete -c tailored -n '__fish_seen_subcommand_from tracker' -a update -d 'Update job status'

# tracker update: status values
complete -c tailored -n '__fish_seen_subcommand_from update' -a '${STATUSES.join(' ')}'

# batch: complete file paths
complete -c tailored -n '__fish_seen_subcommand_from batch' -F

# completions: shell names
complete -c tailored -n '__fish_seen_subcommand_from completions' -a '${SHELLS.join(' ')}'

# Shared flags
complete -c tailored -n '__fish_seen_subcommand_from eval scan cv batch' -l json  -d 'Output JSON'
complete -c tailored -n '__fish_seen_subcommand_from eval scan cv batch' -l debug -d 'Show debug output'
complete -c tailored -n '__fish_seen_subcommand_from batch'              -l concurrency -d 'Max parallel evaluations'
complete -c tailored -n '__fish_seen_subcommand_from scan'               -l limit       -d 'Max jobs per portal'
complete -c tailored -n '__fish_seen_subcommand_from tracker list'       -l status      -d 'Filter by status'
complete -c tailored -n '__fish_seen_subcommand_from tracker list'       -l json        -d 'Output JSON'
`
}

export const completionsCommand = new Command('completions')
  .description('Generate shell completion script')
  .argument('<shell>', `Shell type: ${SHELLS.join(' | ')}`)
  .action((shell: string) => {
    switch (shell) {
      case 'bash':
        process.stdout.write(bashCompletion())
        break
      case 'zsh':
        process.stdout.write(zshCompletion())
        break
      case 'fish':
        process.stdout.write(fishCompletion())
        break
      default:
        process.stderr.write(
          `Error: unsupported shell "${shell}". Supported: ${SHELLS.join(', ')}\n`,
        )
        process.exit(2)
    }
  })
