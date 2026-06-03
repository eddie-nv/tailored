'use client'

import { detectPortalProvider } from '../../lib/detectPortalProvider'

type CustomPortal = {
  id: string
  name: string
  url: string
  enabled: boolean
}

type Props = {
  portals: CustomPortal[]
  onToggle: (id: string, enabled: boolean) => void
  onDelete: (id: string) => void
}

export function CustomPortalList({ portals, onToggle, onDelete }: Props) {
  if (portals.length === 0) {
    return (
      <p className="text-xs text-zinc-400 italic">
        No custom portals yet — add a company career page below.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {portals.map((portal) => {
        const provider = detectPortalProvider(portal.url)
        return (
          <li
            key={portal.id}
            className="flex items-center gap-3 py-2 px-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white group"
          >
            <button
              type="button"
              role="switch"
              aria-checked={portal.enabled}
              onClick={() => onToggle(portal.id, !portal.enabled)}
              className={`relative w-7 h-4 rounded-full transition-colors flex-shrink-0 ${
                portal.enabled ? 'bg-[var(--accent)]' : 'bg-zinc-200'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${
                  portal.enabled ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </button>

            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-zinc-800 truncate">{portal.name}</span>
              <a
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-zinc-400 truncate hover:text-[var(--accent)] transition-colors"
              >
                {portal.url}
              </a>
            </span>

            {provider !== 'Unknown' && (
              <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)]">
                {provider}
              </span>
            )}

            <button
              type="button"
              onClick={() => onDelete(portal.id)}
              aria-label={`Remove ${portal.name}`}
              className="flex-shrink-0 text-zinc-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
