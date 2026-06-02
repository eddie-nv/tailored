'use client'

interface ResultsToolbarProps {
  selectedCount: number
  showArchived: boolean
  onToggleArchived: (v: boolean) => void
  onFocusPaste: () => void
}

export function ResultsToolbar({
  selectedCount,
  showArchived,
  onToggleArchived,
  onFocusPaste,
}: ResultsToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 flex-shrink-0">
      {/* Primary action */}
      <button
        type="button"
        onClick={onFocusPaste}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
      >
        <span aria-hidden="true">+</span>
        Paste URL
      </button>

      {/* Stub: Scan portals (M7) */}
      <button
        type="button"
        disabled
        title="Portal scanning coming in M7"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-500 bg-zinc-800 rounded cursor-not-allowed"
      >
        <span aria-hidden="true">🔍</span>
        Scan
      </button>

      {/* Stub: Evaluate selected (M8) */}
      <button
        type="button"
        disabled={selectedCount === 0}
        title={selectedCount === 0 ? 'Select rows to evaluate' : 'Batch evaluation coming in M8'}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-500 bg-zinc-800 rounded disabled:cursor-not-allowed"
      >
        <span aria-hidden="true">▶</span>
        {selectedCount > 0 ? `Evaluate Selected (${selectedCount})` : 'Evaluate Selected'}
      </button>

      {/* Stub: Generate resume (M9) */}
      <button
        type="button"
        disabled={selectedCount === 0}
        title="Resume generation coming in M9"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-500 bg-zinc-800 rounded disabled:cursor-not-allowed"
      >
        <span aria-hidden="true">📄</span>
        Generate Resume
      </button>

      <div className="ml-auto flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => onToggleArchived(e.target.checked)}
            className="rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900"
          />
          Show archived
        </label>
      </div>
    </div>
  )
}
