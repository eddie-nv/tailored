'use client'

'use client'

import { memo } from 'react'

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
    <div className="flex flex-col gap-1.5">
      <dt className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 leading-none">
        {title}
      </dt>
      <div className="h-px bg-zinc-700/60" />
      {content ? (
        <dd className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap m-0">{content}</dd>
      ) : (
        <dd className="text-sm text-zinc-600 italic m-0">No data</dd>
      )}
    </div>
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
      <div className="flex items-center justify-center py-8 text-zinc-600 text-sm italic">
        No evaluation report yet
      </div>
    )
  }

  let report: EvalReport = {}
  try {
    report = JSON.parse(evalReport) as EvalReport
  } catch {
    return (
      <div className="flex items-center justify-center py-8 text-zinc-600 text-sm italic">
        Unable to parse evaluation report
      </div>
    )
  }

  const hasAnyContent = Object.values(report).some((v) => v && String(v).trim().length > 0)
  if (!hasAnyContent) {
    return (
      <div className="flex items-center justify-center py-8 text-zinc-600 text-sm italic">
        No evaluation report yet
      </div>
    )
  }

  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-6">
      <ReportBlock title="Role Summary" content={report.roleSummary} />
      <ReportBlock title="CV Match" content={report.cvMatch} />
      <ReportBlock title="Level Strategy" content={report.levelStrategy} />
      <ReportBlock title="Compensation" content={report.compensation} />
      <ReportBlock title="Personalization" content={report.personalization} />
      <ReportBlock title="Interview Prep" content={report.interviewPrep} />
    </dl>
  )
})
