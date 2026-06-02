import Anthropic from '@anthropic-ai/sdk'
import { EventType } from '@ag-ui/core'
import type { RunAgentInput, BaseEvent } from '@ag-ui/core'
import { prisma } from '@tailored/db/client'
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { BaseAgent } from '../shared/base-agent'
import { loadAppState } from '../shared/state'
import { RESUME_TEMPLATE_HTML } from './resume-template'

function stepStarted(stepName: string): BaseEvent {
  return { type: EventType.STEP_STARTED, stepName } as BaseEvent
}

function stepFinished(stepName: string): BaseEvent {
  return { type: EventType.STEP_FINISHED, stepName } as BaseEvent
}

function getOutputDir(): string {
  const envDir = process.env['RESUME_OUTPUT_DIR']
  if (envDir) {
    return resolve(envDir)
  }
  return resolve(process.cwd(), 'apps/web/public/resumes')
}

/**
 * Convert simple markdown to HTML.
 * Handles: headings (h1–h4), bold, italic, unordered lists, horizontal rules, paragraphs.
 */
function markdownToHtml(md: string): string {
  const lines = md.split('\n')
  const output: string[] = []
  let inList = false

  const escapeHtml = (text: string): string =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  const applyInline = (text: string): string => {
    return escapeHtml(text)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  }

  for (const line of lines) {
    const h4 = line.match(/^####\s+(.+)/)
    const h3 = line.match(/^###\s+(.+)/)
    const h2 = line.match(/^##\s+(.+)/)
    const h1 = line.match(/^#\s+(.+)/)
    const li = line.match(/^[-*+]\s+(.+)/)
    const hr = line.match(/^---+$|^\*\*\*+$/)

    if (h1) {
      if (inList) { output.push('</ul>'); inList = false }
      output.push(`<h1>${applyInline(h1[1]!)}</h1>`)
    } else if (h2) {
      if (inList) { output.push('</ul>'); inList = false }
      output.push(`<h2>${applyInline(h2[1]!)}</h2>`)
    } else if (h3) {
      if (inList) { output.push('</ul>'); inList = false }
      output.push(`<h3>${applyInline(h3[1]!)}</h3>`)
    } else if (h4) {
      if (inList) { output.push('</ul>'); inList = false }
      output.push(`<h4>${applyInline(h4[1]!)}</h4>`)
    } else if (hr) {
      if (inList) { output.push('</ul>'); inList = false }
      output.push('<hr />')
    } else if (li) {
      if (!inList) { output.push('<ul>'); inList = true }
      output.push(`  <li>${applyInline(li[1]!)}</li>`)
    } else if (line.trim() === '') {
      if (inList) { output.push('</ul>'); inList = false }
      // blank line = paragraph break (no element)
    } else {
      if (inList) { output.push('</ul>'); inList = false }
      output.push(`<p>${applyInline(line)}</p>`)
    }
  }

  if (inList) output.push('</ul>')

  return output.join('\n')
}

export class CVAgent extends BaseAgent {
  private anthropic = new Anthropic()

  protected async *runSteps(
    input: RunAgentInput,
    signal: AbortSignal,
  ): AsyncGenerator<BaseEvent> {
    const state = input.state as Record<string, unknown> | undefined
    const jobId = state?.jobId as string | undefined

    if (!jobId) {
      yield {
        type: EventType.RUN_ERROR,
        message: 'Missing jobId in state',
      } as BaseEvent
      return
    }

    const appState = await loadAppState(prisma)
    const job = appState.jobs.find((j) => j.id === jobId)

    if (!job) {
      yield {
        type: EventType.RUN_ERROR,
        message: `Job ${jobId} not found`,
      } as BaseEvent
      return
    }

    const profile = appState.profile
    const resumePrefs = appState.resumePrefs
    const cv = profile?.cv ?? ''
    const evalReport = job.evalReport ?? ''

    // ── Step 1: Keyword Injection ──────────────────────────────────────────
    yield stepStarted('keyword-injection')

    const keywordRes = await this.anthropic.messages.create(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: `You are a CV optimization specialist. Your task is to take a candidate's existing CV (in markdown) and enhance it by naturally injecting relevant keywords and phrases from the job description's evaluation report.

Rules:
1. Preserve the original structure, tone, and all factual claims — do NOT fabricate experience
2. Naturally weave in relevant keywords, technologies, and terminology from the job's eval report
3. Strengthen bullet points with measurable impact where the candidate's experience supports it
4. Reorder sections or bullets if it improves alignment with the target role
5. Respect any resume preferences provided (tone, keywords to emphasize, section order)
6. Return the full optimized CV in markdown format only — no preamble, no explanation

Tone preference: ${resumePrefs?.tone ?? 'professional and concise'}
Keywords to emphasize: ${resumePrefs?.keywords ? JSON.stringify(resumePrefs.keywords) : 'infer from job description'}`,
        messages: [
          {
            role: 'user',
            content: `Candidate CV:\n\n${cv}\n\n---\n\nJob Evaluation Report (extract keywords and themes):\n\n${evalReport.slice(0, 4000)}\n\n---\n\nTarget role: ${job.role} at ${job.company} (${job.archetype ?? 'unknown archetype'})`,
          },
        ],
      },
      { signal },
    )

    const optimizedCv =
      keywordRes.content[0]?.type === 'text'
        ? keywordRes.content[0].text.trim()
        : cv

    yield stepFinished('keyword-injection')

    // ── Step 2: Template Render ────────────────────────────────────────────
    yield stepStarted('template-render')

    const cvHtml = markdownToHtml(optimizedCv)
    const renderedHtml = RESUME_TEMPLATE_HTML.replace('{{CV_CONTENT}}', cvHtml)

    yield stepFinished('template-render')

    // ── Step 3: PDF Generation ─────────────────────────────────────────────
    yield stepStarted('pdf-generation')

    const outputDir = getOutputDir()
    mkdirSync(outputDir, { recursive: true })

    const timestamp = Date.now()
    const filename = `${jobId}-${timestamp}.pdf`
    const pdfPath = join(outputDir, filename)

    const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    try {
      const page = await browser.newPage()
      await page.setContent(renderedHtml, { waitUntil: 'networkidle' })
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
      writeFileSync(pdfPath, pdfBuffer)
    } finally {
      await browser.close()
    }

    yield stepFinished('pdf-generation')

    // ── Persist GeneratedResume record ────────────────────────────────────
    const generatedResume = await prisma.generatedResume.create({
      data: {
        jobId,
        filename,
        path: pdfPath,
      },
    })

    // ── STATE_DELTA ────────────────────────────────────────────────────────
    const freshState = await loadAppState(prisma)
    const jobIndex = freshState.jobs.findIndex((j) => j.id === jobId)

    if (jobIndex !== -1) {
      const resumeIndex = freshState.jobs[jobIndex]?.resumes?.length ?? 0
      yield {
        type: EventType.STATE_DELTA,
        delta: [
          {
            op: 'add',
            path: `/jobs/${jobIndex}/resumes/${resumeIndex}`,
            value: {
              id: generatedResume.id,
              jobId,
              filename,
              path: pdfPath,
              createdAt: generatedResume.createdAt.toISOString(),
            },
          },
        ],
      } as BaseEvent
    }

    // ── CUSTOM pdf-ready event ─────────────────────────────────────────────
    yield {
      type: EventType.CUSTOM,
      name: 'pdf-ready',
      value: {
        jobId,
        downloadUrl: `/api/resumes/${generatedResume.id}`,
        filename,
      },
    } as BaseEvent
  }
}
