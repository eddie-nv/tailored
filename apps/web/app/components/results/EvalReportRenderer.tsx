'use client'

import { memo } from 'react'
import { Center, Divider, SimpleGrid, Stack, Text } from '@mantine/core'

interface EvalReport {
  roleSummary?: string
  cvMatch?: string
  levelStrategy?: string
  compensation?: string
  personalization?: string
  interviewPrep?: string
}

interface ReportBlockProps {
  title: string
  content: string | undefined
}

const ReportBlock = memo(function ReportBlock({ title, content }: ReportBlockProps) {
  return (
    <Stack gap={6}>
      <Text component="dt" size="xs" fw={600} tt="uppercase" lts="0.1em" c="var(--text-muted)" lh={1}>
        {title}
      </Text>
      <Divider />
      {content ? (
        <Text component="dd" size="sm" c="var(--text-secondary)" lh={1.6} style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
          {content}
        </Text>
      ) : (
        <Text component="dd" size="sm" c="var(--text-faint)" fs="italic" style={{ margin: 0 }}>
          No data
        </Text>
      )}
    </Stack>
  )
})

interface EvalReportRendererProps {
  evalReport: string | null | undefined
}

export const EvalReportRenderer = memo(function EvalReportRenderer({
  evalReport,
}: EvalReportRendererProps) {
  if (!evalReport) {
    return (
      <Center p="xl">
        <Text c="var(--text-faint)" size="sm" fs="italic">No evaluation report yet</Text>
      </Center>
    )
  }

  let report: EvalReport = {}
  try {
    report = JSON.parse(evalReport) as EvalReport
  } catch {
    return (
      <Center p="xl">
        <Text c="var(--text-faint)" size="sm" fs="italic">Unable to parse evaluation report</Text>
      </Center>
    )
  }

  const hasAnyContent = Object.values(report).some((v) => v && String(v).trim().length > 0)
  if (!hasAnyContent) {
    return (
      <Center p="xl">
        <Text c="var(--text-faint)" size="sm" fs="italic">No evaluation report yet</Text>
      </Center>
    )
  }

  return (
    <SimpleGrid component="dl" cols={2} spacing={32} verticalSpacing={24} style={{ margin: 0 }}>
      <ReportBlock title="Role Summary" content={report.roleSummary} />
      <ReportBlock title="CV Match" content={report.cvMatch} />
      <ReportBlock title="Level Strategy" content={report.levelStrategy} />
      <ReportBlock title="Compensation" content={report.compensation} />
      <ReportBlock title="Personalization" content={report.personalization} />
      <ReportBlock title="Interview Prep" content={report.interviewPrep} />
    </SimpleGrid>
  )
})
