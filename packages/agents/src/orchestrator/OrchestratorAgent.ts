import Anthropic from '@anthropic-ai/sdk'
import type { RunAgentInput, BaseEvent, Message } from '@ag-ui/core'
import { prisma } from '@tailored/db/client'
import { BaseAgent } from '../shared/base-agent'
import { loadAppState } from '../shared/state'
import { claudeStreamToEvents } from '../shared/transport'
import type { AppState } from '../shared/state'

type Intent = 'evaluate' | 'scan' | 'generate-cv' | 'update-config' | 'query-tracker' | 'general'

function buildSystemPrompt(state: AppState): string {
  const jobCount = state.jobs.length
  const hasProfile = state.profile !== null

  return `You are Tailored, an AI job search assistant. You help users find, evaluate, and apply for jobs.

USER CONTEXT:
- Jobs tracked: ${jobCount}
- Profile: ${hasProfile ? `Set up (target roles: ${JSON.parse(state.profile!.targetRoles as string).join(', ')})` : 'Not set up yet'}
- Discovery prefs: ${state.discoveryPrefs ? 'Configured' : 'Not configured'}

CAPABILITIES:
• evaluate — evaluate a job posting (paste URL or description)
• scan — scan ${state.discoveryPrefs ? JSON.parse(state.discoveryPrefs.portals).length : 0} job portals for new listings
• generate-cv — generate a tailored CV for an evaluated job
• update-config — update profile, discovery settings, or resume preferences
• query-tracker — check or update job tracker status

Identify the user's intent and respond helpfully. Be concise and direct. If they want to evaluate a job, scan portals, or generate a CV, let them know to use the relevant action in the UI (coming in the next steps of this build). For general questions, answer directly.`
}

function toAnthropicMessages(
  messages: Message[],
): Anthropic.MessageParam[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: typeof m.content === 'string' ? m.content : '',
    }))
    .filter((m) => m.content.length > 0)
}

export class OrchestratorAgent extends BaseAgent {
  private anthropic = new Anthropic()

  protected async *runSteps(
    input: RunAgentInput,
    signal: AbortSignal,
  ): AsyncGenerator<BaseEvent> {
    const [appState] = await Promise.all([loadAppState(prisma)])

    const anthropicMessages = toAnthropicMessages(input.messages)
    if (anthropicMessages.length === 0) {
      return
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
}

export type { Intent }
