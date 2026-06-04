'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Stack, Text } from '@mantine/core'
import type { GeneratedResume } from '@tailored/db'

interface ResumeHistoryProps {
  resumes: GeneratedResume[]
  jobId: string
}

export const ResumeHistory = memo(function ResumeHistory({ resumes }: ResumeHistoryProps) {
  const router = useRouter()

  if (resumes.length === 0) return null

  const sorted = [...resumes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  return (
    <Stack gap={4}>
      <Text component="h4" size="xs" fw={600} tt="uppercase" lts="0.1em" c="var(--text-muted)" mb={4} style={{ margin: '0 0 4px' }}>
        Resume History
      </Text>
      <Stack component="ul" role="list" gap={2} style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {sorted.map((resume, index) => (
          <Box component="li" key={resume.id}>
            <button
              type="button"
              onClick={() => router.push(`/resumes/${resume.id}`)}
              className="resume-history-btn"
            >
              <Text component="span" fw={600} c="var(--foreground)" style={{ flexShrink: 0 }}>
                Version {index + 1}
              </Text>
              <Text component="span" c="var(--text-faint)" aria-hidden="true">—</Text>
              <Text component="span" truncate>{resume.filename}</Text>
              <Text component="span" c="var(--text-faint)" ml="auto" style={{ flexShrink: 0 }}>
                {new Date(resume.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </button>
          </Box>
        ))}
      </Stack>
    </Stack>
  )
})
