'use client'

import { memo } from 'react'
import { Button, Group, Stack, Text } from '@mantine/core'
import type { GeneratedResume } from '@tailored/db'

interface ResumeMiniPreviewProps {
  resumes: GeneratedResume[]
  jobId: string
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
    </svg>
  )
}

export const ResumeMiniPreview = memo(function ResumeMiniPreview({
  resumes,
  jobId,
}: ResumeMiniPreviewProps) {
  if (resumes.length === 0) return null

  const resume = resumes[resumes.length - 1]!
  const previewUrl = `/api/resumes/${resume.id}`

  return (
    <Stack gap={8}>
      <Group justify="space-between">
        <Text component="h4" size="xs" fw={600} tt="uppercase" lts="0.1em" c="var(--text-muted)" style={{ margin: 0 }}>
          Resume Preview
        </Text>
        <Button
          component="a"
          href={previewUrl}
          download={resume.filename}
          aria-label="Download resume"
          variant="light"
          size="xs"
          leftSection={<DownloadIcon />}
          style={{ background: 'rgba(255, 56, 92, 0.1)', color: 'var(--accent)', border: '1px solid rgba(255, 56, 92, 0.3)' }}
        >
          Download
        </Button>
      </Group>
      <iframe
        src={previewUrl}
        title={`Resume preview for job ${jobId}`}
        style={{
          width: '100%',
          borderRadius: 4,
          border: '1px solid var(--border-subtle)',
          background: 'white',
          height: 400,
        }}
        aria-label="Resume PDF preview"
      />
    </Stack>
  )
})
