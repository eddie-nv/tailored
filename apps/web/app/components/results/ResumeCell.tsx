'use client'

import { memo, useState, useRef, useCallback, useEffect } from 'react'
import { createAgent } from '@/app/lib/createAgent'
import { EventType } from '@ag-ui/core'
import type { BaseEvent } from '@ag-ui/core'

const CV_STEPS = ['keyword-injection', 'template-render', 'pdf-generation'] as const
type CvStep = (typeof CV_STEPS)[number]

const STEP_LABELS: Record<CvStep, string> = {
  'keyword-injection': 'Injecting keywords',
  'template-render': 'Rendering template',
  'pdf-generation': 'Generating PDF',
}

type StepStatus = 'pending' | 'active' | 'done'

interface StepState {
  name: CvStep
  status: StepStatus
}

type GenerateStatus = 'idle' | 'running' | 'done' | 'error'

interface ResumeCellProps {
  evaluated: boolean
  resumeDownloadUrl: string | null
  resumeFilename: string | null
  jobId: string
}

export const ResumeCell = memo(function ResumeCell({
  evaluated,
  resumeDownloadUrl,
  resumeFilename,
  jobId,
}: ResumeCellProps) {
  const [status, setStatus] = useState<GenerateStatus>('idle')
  const [steps, setSteps] = useState<StepState[]>(
    CV_STEPS.map((name) => ({ name, status: 'pending' as StepStatus })),
  )
  const [downloadUrl, setDownloadUrl] = useState<string | null>(resumeDownloadUrl)
  const [filename, setFilename] = useState<string | null>(resumeFilename)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<(() => void) | null>(null)
  const liveRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!liveRef.current) return
    const active = steps.find((s) => s.status === 'active')
    const done = steps.filter((s) => s.status === 'done')
    if (active) {
      liveRef.current.textContent = `Generating resume: ${STEP_LABELS[active.name]}`
    } else if (done.length === CV_STEPS.length) {
      liveRef.current.textContent = 'Resume ready for download'
    }
  }, [steps])

  const handleGenerate = useCallback(() => {
    abortRef.current?.()
    setStatus('running')
    setError(null)
    setSteps(CV_STEPS.map((name) => ({ name, status: 'pending' as StepStatus })))

    const threadId = crypto.randomUUID()
    const agent = createAgent({ url: '/api/agents/cv', threadId })

    const obs$ = agent.run({
      threadId,
      runId: crypto.randomUUID(),
      messages: [],
      tools: [],
      context: [],
      forwardedProps: {},
      state: { jobId },
    })

    const sub = obs$.subscribe({
      next(event: BaseEvent) {
        const e = event as BaseEvent & Record<string, unknown>

        if (e.type === EventType.STEP_STARTED) {
          const stepName = e['stepName'] as string
          setSteps((prev) =>
            prev.map((s) => ({
              ...s,
              status: s.name === stepName ? 'active' : s.status,
            })),
          )
        }

        if (e.type === EventType.STEP_FINISHED) {
          const stepName = e['stepName'] as string
          setSteps((prev) =>
            prev.map((s) => ({
              ...s,
              status: s.name === stepName ? 'done' : s.status,
            })),
          )
        }

        if (e.type === EventType.CUSTOM) {
          const name = e['name'] as string
          if (name === 'pdf-ready') {
            const value = e['value'] as { downloadUrl: string; filename: string }
            setDownloadUrl(value.downloadUrl)
            setFilename(value.filename)
            setStatus('done')
          }
        }

        if (e.type === EventType.RUN_ERROR) {
          setStatus('error')
          setError((e['message'] as string) ?? 'Resume generation failed')
        }
      },
      error(err: unknown) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Network error')
      },
    })

    abortRef.current = () => sub.unsubscribe()
  }, [jobId])

  if (!evaluated) {
    return <span className="text-[var(--text-subtle)] text-xs select-none">—</span>
  }

  if (status === 'running') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Resume generation progress"
        className="flex flex-col gap-0.5"
      >
        <div ref={liveRef} className="sr-only" aria-live="polite" />
        {steps.map((step) => (
          <div key={step.name} className="flex items-center gap-1.5">
            <StepDot status={step.status} />
            <span
              className={`text-xs truncate ${
                step.status === 'active'
                  ? 'text-[var(--accent)]'
                  : step.status === 'done'
                    ? 'text-[var(--text-faint)]'
                    : 'text-[var(--text-subtle)]'
              }`}
            >
              {STEP_LABELS[step.name]}
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-red-600 truncate">{error ?? 'Failed'}</span>
        <button
          type="button"
          onClick={handleGenerate}
          className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] underline text-left"
        >
          Retry
        </button>
      </div>
    )
  }

  if (downloadUrl) {
    return (
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Download resume${filename ? `: ${filename}` : ''}`}
        className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
      >
        <DownloadIcon />
        Resume
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={handleGenerate}
      aria-label="Generate resume"
      className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
    >
      Generate
    </button>
  )
})

function StepDot({ status }: { status: StepStatus }) {
  if (status === 'done') {
    return (
      <svg
        aria-hidden="true"
        className="w-3 h-3 text-emerald-500 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  if (status === 'active') {
    return (
      <svg
        aria-hidden="true"
        className="w-3 h-3 animate-spin text-[var(--accent)] shrink-0"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    )
  }
  return (
    <span aria-hidden="true" className="w-3 h-3 rounded-full border border-[var(--border-subtle)] shrink-0 inline-block" />
  )
}

function DownloadIcon() {
  return (
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
  )
}
