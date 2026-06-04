'use client'

import { memo, useState, useRef, useCallback, useEffect } from 'react'
import { Stack, Group, Text, Anchor, Loader, UnstyledButton, Box } from '@mantine/core'
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
          setSteps((prev) => prev.map((s) => ({ ...s, status: s.name === stepName ? 'active' : s.status })))
        }
        if (e.type === EventType.STEP_FINISHED) {
          const stepName = e['stepName'] as string
          setSteps((prev) => prev.map((s) => ({ ...s, status: s.name === stepName ? 'done' : s.status })))
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
    return <Text component="span" size="xs" c="var(--text-subtle)" style={{ userSelect: 'none' }}>—</Text>
  }

  if (status === 'running') {
    return (
      <Stack role="status" aria-live="polite" aria-label="Resume generation progress" gap={2}>
        <div ref={liveRef} className="sr-only" aria-live="polite" />
        {steps.map((step) => (
          <Group key={step.name} gap={6}>
            <StepDot status={step.status} />
            <Text
              component="span"
              size="xs"
              truncate
              c={
                step.status === 'active'
                  ? 'var(--accent)'
                  : step.status === 'done'
                    ? 'var(--text-faint)'
                    : 'var(--text-subtle)'
              }
            >
              {STEP_LABELS[step.name]}
            </Text>
          </Group>
        ))}
      </Stack>
    )
  }

  if (status === 'error') {
    return (
      <Stack gap={2}>
        <Text component="span" size="xs" c="#dc2626" truncate>{error ?? 'Failed'}</Text>
        <UnstyledButton type="button" onClick={handleGenerate} className="text-action-btn" fz="xs" c="var(--accent)" style={{ textDecoration: 'underline' }}>
          Retry
        </UnstyledButton>
      </Stack>
    )
  }

  if (downloadUrl) {
    return (
      <Anchor
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Download resume${filename ? `: ${filename}` : ''}`}
        className="download-link"
      >
        <DownloadIcon />
        Resume
      </Anchor>
    )
  }

  return (
    <UnstyledButton
      type="button"
      onClick={handleGenerate}
      aria-label="Generate resume"
      className="text-action-btn"
      c="var(--text-muted)"
    >
      Generate
    </UnstyledButton>
  )
})

function StepDot({ status }: { status: StepStatus }) {
  if (status === 'done') {
    return (
      <svg aria-hidden="true" style={{ width: 12, height: 12, color: '#10b981', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  if (status === 'active') {
    return <Loader size={12} color="var(--accent)" style={{ flexShrink: 0 }} />
  }
  return (
    <Box
      component="span"
      aria-hidden="true"
      display="inline-block"
      w={12}
      h={12}
      bd="1px solid var(--border-subtle)"
      style={{ borderRadius: '50%', flexShrink: 0 }}
    />
  )
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
    </svg>
  )
}
