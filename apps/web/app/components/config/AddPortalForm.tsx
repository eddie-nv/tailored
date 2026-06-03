'use client'

import { useState } from 'react'
import { detectPortalProvider } from '../../lib/detectPortalProvider'

type Props = {
  onAdd: (name: string, url: string) => Promise<void>
}

export function AddPortalForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const provider = url ? detectPortalProvider(url) : null
  const urlValid = url === '' || (url.startsWith('https://') && (() => { try { new URL(url); return true } catch { return false } })())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) { setError('Company name is required'); return }
    if (!url.trim()) { setError('Careers URL is required'); return }
    if (!urlValid) { setError('URL must be a valid https:// address'); return }

    setSubmitting(true)
    try {
      await onAdd(name.trim(), url.trim())
      setName('')
      setUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add portal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-[var(--border)]">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="portal-name"
            className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-1"
          >
            Company name
          </label>
          <input
            id="portal-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Anthropic"
            maxLength={100}
            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <div>
          <label
            htmlFor="portal-url"
            className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-1"
          >
            Careers URL
          </label>
          <div className="relative">
            <input
              id="portal-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
            {provider && provider !== 'Unknown' && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)]">
                {provider}
              </span>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {submitting ? 'Adding…' : '+ Add portal'}
      </button>
    </form>
  )
}
