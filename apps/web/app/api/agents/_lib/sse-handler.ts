import { RunAgentInputSchema } from '@ag-ui/core'
import { EventEncoder } from '@ag-ui/encoder'
import type { BaseAgent } from '@tailored/agents'
import { corsHeaders, handlePreflight } from './cors'
import { checkRateLimit } from './rate-limit'

export function createAgentHandler(agentFactory: () => BaseAgent) {
  return async function handler(req: Request): Promise<Response> {
    const preflight = handlePreflight(req)
    if (preflight) return preflight

    const rateLimited = checkRateLimit(req)
    if (rateLimited) return rateLimited

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    const parsed = RunAgentInputSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    const agent = agentFactory()
    const encoder = new EventEncoder()
    const events$ = agent.run(parsed.data)

    const stream = new ReadableStream({
      start(controller) {
        const sub = events$.subscribe({
          next(event) {
            controller.enqueue(new TextEncoder().encode(encoder.encodeSSE(event)))
          },
          error() {
            controller.close()
          },
          complete() {
            controller.close()
          },
        })

        req.signal.addEventListener('abort', () => {
          sub.unsubscribe()
          controller.close()
        })
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        ...corsHeaders(),
      },
    })
  }
}
