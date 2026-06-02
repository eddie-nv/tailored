import Anthropic from '@anthropic-ai/sdk'
import { EventType } from '@ag-ui/core'
import type { RunAgentInput, BaseEvent } from '@ag-ui/core'
import { prisma } from '@tailored/db/client'
import { BaseAgent } from '../shared/base-agent'
import { loadAppState } from '../shared/state'
import { claudeStreamToEvents } from '../shared/transport'
import { randomUUID } from 'crypto'

const ARCHETYPES = ['LLMOps', 'Agentic', 'PM', 'SA', 'FDE', 'Transformation'] as const

const GRADES = ['A', 'B+', 'B', 'C', 'D', 'F'] as const
type Grade = typeof GRADES[number]

function scoreToGrade(score: number): Grade {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B+'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}

function stepStarted(stepName: string): BaseEvent {
  return { type: EventType.STEP_STARTED, stepName } as BaseEvent
}

function stepFinished(stepName: string): BaseEvent {
  return { type: EventType.STEP_FINISHED, stepName } as BaseEvent
}

async function fetchJobDescription(input: string): Promise<string> {
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    return input
  }
  try {
    const res = await fetch(input, { signal: AbortSignal.timeout(15000) })
    const html = await res.text()
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 20000)
  } catch {
    return `Job posting available at: ${input}`
  }
}

export class EvaluationAgent extends BaseAgent {
  private anthropic = new Anthropic()

  protected async *runSteps(
    input: RunAgentInput,
    signal: AbortSignal,
  ): AsyncGenerator<BaseEvent> {
    const state = input.state as Record<string, unknown> | undefined
    const pendingJobId = state?.pendingJobId as string | undefined
    const rawInput = (state?.jobDescription as string | undefined) ?? ''

    if (!pendingJobId || !rawInput) {
      yield {
        type: EventType.RUN_ERROR,
        message: 'Missing pendingJobId or jobDescription in state',
      } as BaseEvent
      return
    }

    const jd = await fetchJobDescription(rawInput)
    const appState = await loadAppState(prisma)
    const profile = appState.profile
    const cv = profile?.cv ?? ''
    const scoringWeights = profile?.scoringWeights
      ? safeParseJson<Record<string, number>>(profile.scoringWeights, {})
      : {}

    // ── Step 1: Archetype Detection ──────────────────────────────────────────
    yield stepStarted('archetype-detection')

    const archetypeRes = await this.anthropic.messages.create(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: `You are a job classification expert. Given a job description, identify:
1. The job archetype (exactly one of: ${ARCHETYPES.join(', ')})
2. The company name
3. The role title

Definitions:
- LLMOps: LLM infrastructure, model serving, prompt management, ML platform
- Agentic: AI agent systems, multi-agent orchestration, autonomous AI workflows
- PM: Product management, program management, product strategy
- SA: Solutions architecture, technical consulting, pre-sales engineering
- FDE: Field/developer experience engineering, developer advocacy, developer relations
- Transformation: Org transformation, digital transformation, change management, enterprise modernization

Respond in JSON only: {"archetype": "...", "company": "...", "role": "..."}`,
        messages: [{ role: 'user', content: `Job description:\n\n${jd.slice(0, 8000)}` }],
      },
      { signal },
    )

    const archetypeText =
      archetypeRes.content[0]?.type === 'text' ? archetypeRes.content[0].text : '{}'
    const archetypeData = safeParseJson<{
      archetype: string
      company: string
      role: string
    }>(archetypeText, { archetype: 'Agentic', company: 'Unknown', role: 'Unknown' })

    const archetype = ARCHETYPES.includes(archetypeData.archetype as (typeof ARCHETYPES)[number])
      ? archetypeData.archetype
      : 'Agentic'
    const company = archetypeData.company || 'Unknown'
    const role = archetypeData.role || 'Unknown'

    await prisma.job.update({
      where: { id: pendingJobId },
      data: { archetype, company, role },
    })

    yield stepFinished('archetype-detection')

    // ── Step 2: Scoring ──────────────────────────────────────────────────────
    yield stepStarted('scoring')

    const targetRoles = profile?.targetRoles
      ? safeParseJson<string[]>(profile.targetRoles, []).join(', ')
      : 'not specified'
    const location = profile?.location ?? 'not specified'
    const workType = profile?.workType ?? 'not specified'
    const salaryMin = profile?.salaryMin ?? null
    const salaryMax = profile?.salaryMax ?? null

    const scoringRes = await this.anthropic.messages.create(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: `You are a job fit evaluator. Score a job on 10 dimensions (0-10 each), then compute a weighted total.

Dimensions:
1. role_seniority_alignment - Does seniority match candidate's experience level?
2. tech_stack_match - Does the tech stack align with candidate's skills?
3. industry_relevance - Is the industry relevant to candidate's background?
4. compensation_fit - Does compensation align with candidate's expectations?
5. location_compatibility - Is location/remote setup compatible?
6. company_stage_fit - Does company stage/size suit candidate's preference?
7. growth_potential - Does the role offer meaningful career growth?
8. work_life_signals - Are work-life balance indicators positive?
9. team_structure - Are team size and structure appealing?
10. jd_quality - Is the JD specific and well-written (signal of company quality)?

Respond JSON only: {"scores": {"role_seniority_alignment": 8, ...}, "total": 73, "reasoning": "..."}`,
        messages: [
          {
            role: 'user',
            content: `Candidate profile:
- Target roles: ${targetRoles}
- Location preference: ${location}
- Work type: ${workType}
- Salary range: ${salaryMin && salaryMax ? `$${salaryMin.toLocaleString()}–$${salaryMax.toLocaleString()}` : 'not specified'}
- Archetype: ${archetype}

Scoring weights (overrides if set): ${JSON.stringify(scoringWeights)}

Job description:
${jd.slice(0, 6000)}`,
          },
        ],
      },
      { signal },
    )

    const scoringText =
      scoringRes.content[0]?.type === 'text' ? scoringRes.content[0].text : '{}'
    const scoringData = safeParseJson<{ scores: Record<string, number>; total: number }>(
      scoringText,
      { scores: {}, total: 50 },
    )

    const rawScore = applyWeights(scoringData.scores, scoringWeights)
    const score = scoreToGrade(rawScore)

    await prisma.job.update({ where: { id: pendingJobId }, data: { score } })

    yield stepFinished('scoring')

    // ── Step 3: CV Match ─────────────────────────────────────────────────────
    yield stepStarted('cv-match')

    const cvMatchRes = await this.anthropic.messages.create(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: `You are a CV-to-job-description matcher. Given a CV and a job description, compute a match percentage (0-100) based on:
- Required skills coverage
- Experience level alignment
- Domain/industry relevance
- Education/certification match

Respond JSON only: {"cvMatchPct": 75, "matched_requirements": ["...", "..."], "gaps": ["...", "..."]}`,
        messages: [
          {
            role: 'user',
            content: `CV:\n${cv.slice(0, 4000)}\n\nJob description:\n${jd.slice(0, 4000)}`,
          },
        ],
      },
      { signal },
    )

    const cvText = cvMatchRes.content[0]?.type === 'text' ? cvMatchRes.content[0].text : '{}'
    const cvData = safeParseJson<{ cvMatchPct: number; matched_requirements: string[]; gaps: string[] }>(
      cvText,
      { cvMatchPct: 50, matched_requirements: [], gaps: [] },
    )
    const cvMatchPct = Math.max(0, Math.min(100, Math.round(cvData.cvMatchPct)))

    await prisma.job.update({ where: { id: pendingJobId }, data: { cvMatchPct } })

    yield stepFinished('cv-match')

    // ── Step 4: Compensation Research ────────────────────────────────────────
    yield stepStarted('compensation-research')

    const compRes = await this.anthropic.messages.create(
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: `You are a compensation research specialist. Analyze the job description for compensation signals and provide market rate estimates based on your training data.

Research:
1. Explicit salary range (if mentioned)
2. Estimated market rate for this role/level/location
3. Equity/bonus signals
4. Benefits indicators

Respond JSON only: {
  "explicit_range": "mentioned or null",
  "estimated_range": "$X–$Y",
  "equity_signals": "description or null",
  "benefits_highlights": ["...", "..."],
  "market_notes": "brief market context"
}`,
        messages: [
          {
            role: 'user',
            content: `Role: ${role} at ${company} (${archetype})\nLocation/type: ${location} / ${workType}\n\nJob description:\n${jd.slice(0, 5000)}`,
          },
        ],
      },
      { signal },
    )

    const compText = compRes.content[0]?.type === 'text' ? compRes.content[0].text : '{}'
    const compData = safeParseJson<Record<string, unknown>>(compText, {})

    yield stepFinished('compensation-research')

    // ── Step 5: Report Generation (streaming) ────────────────────────────────
    yield stepStarted('report-generation')

    const reportStream = this.anthropic.messages.stream(
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: `You are a career strategy advisor writing a structured job evaluation report.

Write a concise 6-block markdown report. Use this exact structure with these exact headings:

## Role Summary
2-3 sentences: what the company does, what this role does, who it reports to.

## CV Match (${cvMatchPct}%)
Matched requirements: list top 3. Key gaps: list top 2. One sentence on fit.

## Level Strategy
Seniority assessment, positioning advice, any leveling risks or upside.

## Compensation
${JSON.stringify(compData)}
Analysis: is this competitive? Negotiation notes.

## Personalization
3 specific talking points tailored to this candidate's background. What to emphasize in the application.

## Interview Prep
Top 5 likely interview topics. 1-2 likely hard questions with suggested approach.

Keep each block tight. Be direct. No filler.`,
        messages: [
          {
            role: 'user',
            content: `Evaluate this job for me.

Profile:
- Target roles: ${targetRoles}
- CV excerpt: ${cv.slice(0, 2000)}

Job: ${role} at ${company} (${archetype})
Score: ${score} | CV Match: ${cvMatchPct}%

Job description:
${jd.slice(0, 5000)}`,
          },
        ],
      },
      { signal },
    )

    let reportText = ''
    const reportId = randomUUID()

    yield {
      type: EventType.TEXT_MESSAGE_START,
      messageId: reportId,
      role: 'assistant',
    } as BaseEvent

    for await (const chunk of reportStream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        reportText += chunk.delta.text
        yield {
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: reportId,
          delta: chunk.delta.text,
        } as BaseEvent
      }
    }

    yield { type: EventType.TEXT_MESSAGE_END, messageId: reportId } as BaseEvent

    // Parse 6-block report into structured object
    const evalReport = parseReportBlocks(reportText)

    // Write final results to DB
    await prisma.job.update({
      where: { id: pendingJobId },
      data: {
        evalReport: JSON.stringify(evalReport),
        status: 'reviewed',
      },
    })

    yield stepFinished('report-generation')

    // ── STATE_DELTA ──────────────────────────────────────────────────────────
    const freshState = await loadAppState(prisma)
    const jobIndex = freshState.jobs.findIndex((j) => j.id === pendingJobId)

    if (jobIndex !== -1) {
      yield {
        type: EventType.STATE_DELTA,
        delta: [
          { op: 'replace', path: `/jobs/${jobIndex}/score`, value: score },
          { op: 'replace', path: `/jobs/${jobIndex}/archetype`, value: archetype },
          { op: 'replace', path: `/jobs/${jobIndex}/company`, value: company },
          { op: 'replace', path: `/jobs/${jobIndex}/role`, value: role },
          { op: 'replace', path: `/jobs/${jobIndex}/cvMatchPct`, value: cvMatchPct },
          { op: 'replace', path: `/jobs/${jobIndex}/evalReport`, value: JSON.stringify(evalReport) },
          { op: 'replace', path: `/jobs/${jobIndex}/status`, value: 'reviewed' },
        ],
      } as BaseEvent
    }

    // CUSTOM event for immediate consumption by any listener
    yield {
      type: EventType.CUSTOM,
      name: 'job-evaluated',
      value: {
        jobId: pendingJobId,
        score,
        archetype,
        company,
        role,
        cvMatchPct,
        evalReport,
        status: 'reviewed',
      },
    } as BaseEvent

    // Set interrupt outcome so BaseAgent emits RUN_FINISHED with interrupt
    this.runOutcome = {
      type: 'interrupt',
      interrupts: [
        {
          id: randomUUID(),
          reason: 'confirm-add-to-tracker',
          message: `Evaluation complete for ${role} at ${company} (Score: ${score}, CV Match: ${cvMatchPct}%). Add to your tracker?`,
          metadata: { jobId: pendingJobId, score, archetype, cvMatchPct },
        },
      ],
    }
  }
}

function safeParseJson<T>(value: string, fallback: T): T {
  try {
    // Extract JSON from markdown code blocks if present
    const match = value.match(/```(?:json)?\s*([\s\S]*?)```/) ?? value.match(/(\{[\s\S]*\})/)
    const raw = match ? match[1] ?? value : value
    return JSON.parse(raw.trim()) as T
  } catch {
    return fallback
  }
}

function applyWeights(
  scores: Record<string, number>,
  weights: Record<string, number>,
): number {
  const keys = Object.keys(scores)
  if (keys.length === 0) return 50

  const hasWeights = Object.keys(weights).length > 0
  let total = 0
  let weightSum = 0

  for (const key of keys) {
    const score = scores[key] ?? 5
    const weight = hasWeights ? (weights[key] ?? 1) : 1
    total += score * weight * 10
    weightSum += weight * 10
  }

  return weightSum > 0 ? Math.round((total / weightSum) * 10) : 50
}

function parseReportBlocks(text: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const headings = [
    'Role Summary',
    'CV Match',
    'Level Strategy',
    'Compensation',
    'Personalization',
    'Interview Prep',
  ]

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i]!
    const nextHeading = headings[i + 1]
    const pattern = new RegExp(
      `##\\s*${heading}[^\n]*\n([\\s\\S]*?)${nextHeading ? `(?=##\\s*${nextHeading})` : '$'}`,
      'i',
    )
    const match = text.match(pattern)
    sections[heading] = match ? match[1]!.trim() : ''
  }

  return sections
}
