import Anthropic from '@anthropic-ai/sdk'

const SEARCH_MODEL = 'claude-haiku-4-5-20251001'

export interface SearchHit {
  title: string
  url: string
  company: string
  queryName: string
  location?: string
}

export function isValidHttpsUrl(url: string): boolean {
  if (!url.startsWith('https://')) return false
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

export function parseSearchSnippet(snippet: string): { title: string; company: string } | null {
  if (!snippet || !snippet.trim()) return null

  const separators = [' @ ', ' | ', ' — ', ' at ']

  for (const sep of separators) {
    const idx = snippet.indexOf(sep)
    if (idx > 0) {
      const title = snippet.slice(0, idx).trim()
      const company = snippet.slice(idx + sep.length).trim()
      if (title && company) return { title, company }
    }
  }

  return null
}

export async function checkUrlLive(url: string, signal: AbortSignal): Promise<boolean> {
  if (!url.startsWith('https://')) return false
  try {
    const res = await fetch(url, { method: 'HEAD', signal })
    return res.ok || (res.status >= 300 && res.status < 400)
  } catch {
    return false
  }
}

export async function runSearchQuery(
  query: string,
  queryName: string,
  signal: AbortSignal,
): Promise<SearchHit[]> {
  const client = new Anthropic()

  try {
    const response = await client.messages.create(
      {
        model: SEARCH_MODEL,
        max_tokens: 1024,
        // web_search_20260209 is a server-side tool; not yet in SDK 0.39.0 type union
        tools: [{ type: 'web_search_20260209', name: 'web_search' }] as unknown as Anthropic.Messages.ToolUnion[],
        messages: [
          {
            role: 'user',
            content: `Search for job postings using this query: "${query}"

Return ONLY a JSON array with no surrounding text:
[{"title": "Job Title", "url": "https://...", "company": "Company Name"}]

If no results found, return: []`,
          },
        ],
      },
      { signal },
    )

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') return []

    const text = textBlock.text.trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/\[[\s\S]*\]/)
      if (!match) return []
      try {
        parsed = JSON.parse(match[0])
      } catch {
        return []
      }
    }

    if (!Array.isArray(parsed)) return []

    return (parsed as Array<Record<string, unknown>>)
      .filter(
        (item) =>
          typeof item.title === 'string' &&
          typeof item.url === 'string' &&
          typeof item.company === 'string',
      )
      .map((item) => ({
        title: item.title as string,
        url: item.url as string,
        company: item.company as string,
        queryName,
      }))
  } catch {
    return []
  }
}
