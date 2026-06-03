'use client'

import { useRouter } from 'next/navigation'

interface ResumeViewerProps {
  id: string
  filename: string
  versionLabel: string
  formattedDate: string
}

export function ResumeViewer({ id, filename, versionLabel, formattedDate }: ResumeViewerProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col h-screen bg-[var(--background)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] bg-white">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="
            flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm
            text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]
            focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/60
            transition-colors
          "
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="h-4 w-px bg-[var(--border-divider)]" aria-hidden="true" />

        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="font-semibold text-[var(--foreground)] shrink-0">{versionLabel}</span>
          <span className="text-[var(--text-faint)] shrink-0" aria-hidden="true">·</span>
          <span className="text-[var(--text-muted)] truncate">{filename}</span>
          <span className="text-[var(--text-faint)] shrink-0" aria-hidden="true">·</span>
          <span className="text-[var(--text-faint)] text-xs shrink-0">{formattedDate}</span>
        </div>

        <a
          href={`/api/resumes/${id}`}
          download={filename}
          className="
            ml-auto shrink-0 inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium
            bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30
            hover:bg-[var(--accent)]/15 hover:text-[var(--accent-hover)]
            focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/60
            transition-colors
          "
        >
          <svg
            aria-hidden="true"
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
          Download
        </a>
      </div>

      <iframe
        src={`/api/resumes/${id}`}
        title={`${versionLabel} — ${filename}`}
        className="flex-1 w-full border-none"
        aria-label={`Resume PDF: ${versionLabel}`}
      />
    </div>
  )
}
