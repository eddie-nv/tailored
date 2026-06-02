import Anthropic from '@anthropic-ai/sdk'
import type { RunAgentInput, BaseEvent, Message } from '@ag-ui/core'
import { prisma } from '@tailored/db/client'
import { BaseAgent } from '../shared/base-agent'
import { loadAppState } from '../shared/state'
import { claudeStreamToEvents } from '../shared/transport'
import type { AppState } from '../shared/state'

type Intent = 'evaluate' | 'scan' | 'generate-cv' | 'update-config' | 'query-tracker' | 'general'

const CONFIG_TOOLS: Anthropic.Tool[] = [
  {
    name: 'update_profile',
    description:
      'Update user profile: target roles, location, work type (remote/hybrid/onsite), or salary range.',
    input_schema: {
      type: 'object' as const,
      properties: {
        targetRoles: {
          type: 'array',
          items: { type: 'string' },
          description: 'New complete list of target job roles',
        },
        location: { type: 'string', description: 'Target work location' },
        workType: {
          type: 'string',
          enum: ['remote', 'hybrid', 'onsite'],
          description: 'Work type preference',
        },
        salaryMin: { type: 'number', description: 'Minimum annual salary (USD)' },
        salaryMax: { type: 'number', description: 'Maximum annual salary (USD)' },
      },
    },
  },
  {
    name: 'update_discovery',
    description: 'Update discovery preferences: keywords, archetypes, or minimum score threshold.',
    input_schema: {
      type: 'object' as const,
      properties: {
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'New complete list of search keywords',
        },
        archetypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'New complete list of job archetypes',
        },
        minScore: {
          type: 'string',
          enum: ['A', 'B', 'C', 'D', 'F'],
          description: 'Minimum acceptable job score',
        },
      },
    },
  },
  {
    name: 'update_resume_prefs',
    description: 'Update resume preferences: template, writing tone, or emphasis keywords.',
    input_schema: {
      type: 'object' as const,
      properties: {
        template: {
          type: 'string',
          enum: ['default', 'minimal', 'dense'],
          description: 'Resume template',
        },
        tone: { type: 'string', description: 'Writing tone for the resume' },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'New complete list of emphasis keywords',
        },
      },
    },
  },
]

function buildSystemPrompt(state: AppState): string {
  const jobCount = state.jobs.length
  const hasProfile = state.profile !== null
  const targetRoles = hasProfile
    ? (safeParseJson<string[]>(state.profile!.targetRoles, []).join(', ') || 'none set')
    : 'not set'

  return `You are Tailored, an AI job search assistant. You help users find, evaluate, and apply for jobs.

USER CONTEXT:
- Jobs tracked: ${jobCount}
- Profile: ${hasProfile ? `Set up (target roles: ${targetRoles})` : 'Not set up yet'}
- Discovery prefs: ${state.discoveryPrefs ? 'Configured' : 'Not configured'}

CAPABILITIES:
• evaluate — evaluate a job posting (paste URL or description)
• scan — scan job portals for new listings
• generate-cv — generate a tailored CV for an evaluated job
• update-config — update profile, discovery settings, or resume preferences (use config update tools)
• query-tracker — check or update job tracker status

When the user wants to update their configuration, use the appropriate config update tool.
For general questions, answer directly and concisely.`
}

function toAnthropicMessages(messages: Message[]): Anthropic.MessageParam[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: typeof m.content === 'string' ? m.content : '',
    }))
    .filter((m) => m.content.length > 0)
}

function looksLikeConfigUpdate(messages: Anthropic.MessageParam[]): boolean {
  const last = messages[messages.length - 1]
  if (!last || last.role !== 'user') return false

  const text =
    typeof last.content === 'string'
      ? last.content
      : (last.content as Anthropic.ContentBlockParam[])
          .filter((b): b is Anthropic.TextBlockParam => b.type === 'text')
          .map((b) => b.text)
          .join(' ')

  const lower = text.toLowerCase()
  return (
    lower.includes('target role') ||
    lower.includes('salary') ||
    lower.includes('work type') ||
    lower.includes('remote') ||
    lower.includes('hybrid') ||
    lower.includes('onsite') ||
    lower.includes('portal') ||
    lower.includes('archetype') ||
    lower.includes('template') ||
    lower.includes('section order') ||
    lower.includes('update my') ||
    lower.includes('change my') ||
    lower.includes('set my') ||
    lower.includes('modify my') ||
    (lower.includes('add ') && lower.includes(' to')) ||
    (lower.includes('remove ') && lower.includes(' from'))
  )
}

function safeParseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export class OrchestratorAgent extends BaseAgent {
  private anthropic = new Anthropic()

  protected async *runSteps(
    input: RunAgentInput,
    signal: AbortSignal,
  ): AsyncGenerator<BaseEvent> {
    const appState = await loadAppState(prisma)
    const anthropicMessages = toAnthropicMessages(input.messages)
    if (anthropicMessages.length === 0) return

    if (looksLikeConfigUpdate(anthropicMessages)) {
      const updated = await this.tryConfigUpdate(anthropicMessages, appState, signal)
      if (updated) {
        yield* this.streamConfirmation(
          anthropicMessages,
          updated,
          appState,
          input.runId ?? '',
          input.threadId,
          signal,
        )
        return
      }
    }

    const stream = this.anthropic.messages.stream(
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: buildSystemPrompt(appState),
        messages: anthropicMessages,
      },
      { signal },
    )

    yield* claudeStreamToEvents(stream, {
      runId: input.runId ?? '',
      threadId: input.threadId,
    })
  }

  private async tryConfigUpdate(
    messages: Anthropic.MessageParam[],
    appState: AppState,
    signal: AbortSignal,
  ): Promise<Anthropic.Messages.ToolUseBlock[] | null> {
    const response = await this.anthropic.messages.create(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: buildSystemPrompt(appState),
        tools: CONFIG_TOOLS,
        messages,
      },
      { signal },
    )

    if (response.stop_reason !== 'tool_use') return null

    const toolBlocks = response.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use',
    )
    if (toolBlocks.length === 0) return null

    for (const block of toolBlocks) {
      await this.executeConfigTool(block.name, block.input as Record<string, unknown>)
    }

    return toolBlocks
  }

  private async *streamConfirmation(
    originalMessages: Anthropic.MessageParam[],
    toolBlocks: Anthropic.Messages.ToolUseBlock[],
    appState: AppState,
    runId: string,
    threadId: string,
    signal: AbortSignal,
  ): AsyncGenerator<BaseEvent> {
    const toolResults: Anthropic.ToolResultBlockParam[] = toolBlocks.map((b) => ({
      type: 'tool_result' as const,
      tool_use_id: b.id,
      content: 'Done',
    }))

    const confirmMessages: Anthropic.MessageParam[] = [
      ...originalMessages,
      { role: 'assistant' as const, content: toolBlocks as unknown as Anthropic.ContentBlockParam[] },
      { role: 'user' as const, content: toolResults },
    ]

    const stream = this.anthropic.messages.stream(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: buildSystemPrompt(appState),
        messages: confirmMessages,
      },
      { signal },
    )

    yield* claudeStreamToEvents(stream, { runId, threadId })
  }

  private async executeConfigTool(name: string, input: Record<string, unknown>): Promise<void> {
    if (name === 'update_profile') {
      const updateData: Record<string, unknown> = {}
      if (Array.isArray(input.targetRoles)) updateData.targetRoles = JSON.stringify(input.targetRoles)
      if (typeof input.location === 'string') updateData.location = input.location
      if (typeof input.workType === 'string') updateData.workType = input.workType
      if (typeof input.salaryMin === 'number') updateData.salaryMin = input.salaryMin
      if (typeof input.salaryMax === 'number') updateData.salaryMax = input.salaryMax

      const existing = await prisma.profile.findFirst()
      if (existing) {
        await prisma.profile.update({ where: { id: existing.id }, data: updateData })
      } else {
        await prisma.profile.create({
          data: {
            cv: '',
            targetRoles: JSON.stringify([]),
            scoringWeights: JSON.stringify({}),
            ...updateData,
          },
        })
      }
      return
    }

    if (name === 'update_discovery') {
      const updateData: Record<string, unknown> = {}
      if (Array.isArray(input.keywords)) updateData.keywords = JSON.stringify(input.keywords)
      if (Array.isArray(input.archetypes)) updateData.archetypes = JSON.stringify(input.archetypes)
      if (typeof input.minScore === 'string') updateData.minScore = input.minScore

      const existing = await prisma.discoveryPrefs.findFirst()
      if (existing) {
        await prisma.discoveryPrefs.update({ where: { id: existing.id }, data: updateData })
      } else {
        await prisma.discoveryPrefs.create({
          data: {
            portals: JSON.stringify([]),
            keywords: JSON.stringify([]),
            archetypes: JSON.stringify([]),
            ...updateData,
          },
        })
      }
      return
    }

    if (name === 'update_resume_prefs') {
      const updateData: Record<string, unknown> = {}
      if (typeof input.template === 'string') updateData.template = input.template
      if (typeof input.tone === 'string') updateData.tone = input.tone
      if (Array.isArray(input.keywords)) updateData.keywords = JSON.stringify(input.keywords)

      const existing = await prisma.resumePrefs.findFirst()
      if (existing) {
        await prisma.resumePrefs.update({ where: { id: existing.id }, data: updateData })
      } else {
        await prisma.resumePrefs.create({
          data: {
            sectionOrder: JSON.stringify(['summary', 'experience', 'skills', 'education']),
            keywords: JSON.stringify([]),
            ...updateData,
          },
        })
      }
    }
  }
}

export type { Intent }
