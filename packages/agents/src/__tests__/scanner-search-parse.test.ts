import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseSearchSnippet, checkUrlLive } from '../scanner/searchQuery'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('parseSearchSnippet', () => {
  it('parses "@" separator', () => {
    expect(parseSearchSnippet('Senior AI PM (Remote) @ EverAI')).toEqual({
      title: 'Senior AI PM (Remote)',
      company: 'EverAI',
    })
  })

  it('parses "at" word-boundary separator', () => {
    expect(parseSearchSnippet('AI Engineer at Anthropic')).toEqual({
      title: 'AI Engineer',
      company: 'Anthropic',
    })
  })

  it('parses "|" pipe separator', () => {
    expect(parseSearchSnippet('Product Manager - AI | Temporal')).toEqual({
      title: 'Product Manager - AI',
      company: 'Temporal',
    })
  })

  it('parses em-dash separator', () => {
    expect(parseSearchSnippet('ML Engineer — Cohere')).toEqual({
      title: 'ML Engineer',
      company: 'Cohere',
    })
  })

  it('returns null for snippet with no recognised separator', () => {
    expect(parseSearchSnippet('Senior Engineer No Separator Here')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseSearchSnippet('')).toBeNull()
  })

  it('returns null for whitespace-only string', () => {
    expect(parseSearchSnippet('   ')).toBeNull()
  })
})

describe('checkUrlLive', () => {
  const signal = new AbortController().signal

  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true for a 200 response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })
    expect(await checkUrlLive('https://example.com/jobs/1', signal)).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/jobs/1',
      expect.objectContaining({ method: 'HEAD' }),
    )
  })

  it('returns true for a 301 redirect', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 301 })
    expect(await checkUrlLive('https://example.com/jobs/1', signal)).toBe(true)
  })

  it('returns true for a 302 redirect', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 302 })
    expect(await checkUrlLive('https://example.com/jobs/1', signal)).toBe(true)
  })

  it('returns false for a 404 response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
    expect(await checkUrlLive('https://example.com/jobs/dead', signal)).toBe(false)
  })

  it('returns false on network error without throwing', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))
    expect(await checkUrlLive('https://example.com/jobs/1', signal)).toBe(false)
  })

  it('returns false for http:// URL without fetching', async () => {
    expect(await checkUrlLive('http://example.com/job', signal)).toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns false for javascript: URL without fetching', async () => {
    expect(await checkUrlLive('javascript:alert(1)', signal)).toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns false for data: URL without fetching', async () => {
    expect(await checkUrlLive('data:text/plain,hello', signal)).toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
