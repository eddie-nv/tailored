'use client'

import { memo } from 'react'

interface ResumeCellProps {
  evaluated: boolean
  hasResume: boolean
  jobId: string
}

export const ResumeCell = memo(function ResumeCell({
  evaluated,
  hasResume,
  jobId,
}: ResumeCellProps) {
  if (!evaluated) {
    return <span className="text-zinc-700 text-xs select-none">—</span>
  }

  if (hasResume) {
    return (
      <a
        href={`/api/resumes/${jobId}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Download resume"
        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
      >
        <svg
          aria-hidden="true"
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
          />
        </svg>
        Resume
      </a>
    )
  }

  // Evaluated, no resume yet — Generate button (wired in M9)
  return (
    <button
      type="button"
      disabled
      title="Resume generation available in M9"
      aria-label="Generate resume (coming soon)"
      className="text-xs text-zinc-500 cursor-not-allowed"
    >
      Generate
    </button>
  )
})
