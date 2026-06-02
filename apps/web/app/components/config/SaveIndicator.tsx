export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type Props = { status: SaveStatus }

export function SaveIndicator({ status }: Props) {
  if (status === 'idle') return null

  const label =
    status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Error saving'
  const color =
    status === 'saving' ? 'text-zinc-400' : status === 'saved' ? 'text-emerald-600' : 'text-red-500'

  return <span className={`text-[11px] font-medium ${color}`}>{label}</span>
}
