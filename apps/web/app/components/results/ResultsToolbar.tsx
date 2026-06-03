'use client'

type BatchProgress = {
  completed: number
  total: number
}

type ResultsToolbarProps = {
  selectedCount: number
  showArchived: boolean
  onToggleArchived: (v: boolean) => void
  onFocusPaste: () => void
  onScan: () => void
  isScanRunning: boolean
  onEvaluateSelected: () => void
  isBatchRunning: boolean
  batchProgress?: BatchProgress
}

export function ResultsToolbar({
  selectedCount,
  showArchived,
  onToggleArchived,
  onFocusPaste,
  onScan,
  isScanRunning,
  onEvaluateSelected,
  isBatchRunning,
  batchProgress,
}: ResultsToolbarProps) {
  const evalLabel = isBatchRunning
    ? `Evaluating ${batchProgress?.completed ?? 0} of ${batchProgress?.total ?? 0}…`
    : selectedCount > 0
      ? `Evaluate Selected (${selectedCount})`
      : 'Evaluate Selected'

  const isEvalDisabled = isBatchRunning || selectedCount === 0

  const evalTitle = isBatchRunning
    ? 'Batch evaluation in progress'
    : selectedCount === 0
      ? 'Select rows to evaluate'
      : `Evaluate ${selectedCount} selected job${selectedCount === 1 ? '' : 's'}`

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-divider)] flex-shrink-0">
      {/* Paste URL */}
      <button
        type="button"
        onClick={onFocusPaste}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded transition-colors"
      >
        <span aria-hidden="true">+</span>
        Paste URL
      </button>

      {/* Scan portals */}
      <button
        type="button"
        onClick={onScan}
        disabled={isScanRunning}
        title={isScanRunning ? 'Scan in progress…' : 'Scan configured portals for new jobs'}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[var(--foreground)] hover:bg-[var(--text-secondary)] disabled:bg-[var(--surface-disabled)] disabled:text-[var(--text-faint)] text-white rounded transition-colors disabled:cursor-not-allowed"
      >
        {isScanRunning ? (
          <>
            <Spinner />
            Scanning…
          </>
        ) : (
          <>
            <span aria-hidden="true">🔍</span>
            Scan
          </>
        )}
      </button>

      {/* Evaluate selected */}
      <button
        type="button"
        disabled={isEvalDisabled}
        title={evalTitle}
        onClick={isEvalDisabled ? undefined : onEvaluateSelected}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded transition-colors disabled:cursor-not-allowed disabled:text-[var(--text-faint)] disabled:bg-[var(--surface-disabled)] enabled:text-white enabled:bg-[var(--accent-dark)] enabled:hover:bg-[var(--accent)]"
      >
        {isBatchRunning ? <Spinner /> : <span aria-hidden="true">▶</span>}
        {evalLabel}
      </button>

      {/* Generate resume (M9 stub) */}
      <button
        type="button"
        disabled={selectedCount === 0}
        title="Resume generation coming in M9"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[var(--text-faint)] bg-[var(--surface-disabled)] rounded disabled:cursor-not-allowed"
      >
        <span aria-hidden="true">📄</span>
        Generate Resume
      </button>

      <div className="ml-auto flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => onToggleArchived(e.target.checked)}
            className="rounded border-[var(--text-faint)] bg-white text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-white"
          />
          Show archived
        </label>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="w-3 h-3 animate-spin shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
