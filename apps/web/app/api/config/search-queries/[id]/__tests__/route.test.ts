import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH, DELETE } from '../route'
import { prisma } from '@tailored/db/client'

vi.mock('@tailored/db/client', () => ({
  prisma: {
    searchQuery: {
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

const mockQuery = {
  id: 'sq-1',
  name: 'Senior Eng Remote',
  query: 'senior software engineer remote site:ashbyhq.com',
  enabled: true,
  createdAt: new Date(),
}

function makePatchRequest(id: string, body: unknown) {
  return new Request(`http://localhost/api/config/search-queries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeDeleteRequest(id: string) {
  return new Request(`http://localhost/api/config/search-queries/${id}`, {
    method: 'DELETE',
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PATCH /api/config/search-queries/[id]', () => {
  it('toggles enabled field', async () => {
    vi.mocked(prisma.searchQuery.update).mockResolvedValueOnce({ ...mockQuery, enabled: false })
    const req = makePatchRequest('sq-1', { enabled: false })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'sq-1' }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(vi.mocked(prisma.searchQuery.update)).toHaveBeenCalledWith({
      where: { id: 'sq-1' },
      data: { enabled: false },
    })
  })

  it('updates name and query fields', async () => {
    vi.mocked(prisma.searchQuery.update).mockResolvedValueOnce({
      ...mockQuery,
      name: 'Updated',
      query: 'new query',
    })
    const req = makePatchRequest('sq-1', { name: 'Updated', query: 'new query' })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'sq-1' }) })

    expect(res.status).toBe(200)
    expect(vi.mocked(prisma.searchQuery.update)).toHaveBeenCalledWith({
      where: { id: 'sq-1' },
      data: { name: 'Updated', query: 'new query' },
    })
  })

  it('returns 404 for missing id', async () => {
    vi.mocked(prisma.searchQuery.update).mockRejectedValueOnce(
      Object.assign(new Error('Not found'), { code: 'P2025' }),
    )
    const req = makePatchRequest('nonexistent', { enabled: true })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) })

    expect(res.status).toBe(404)
  })

  it('rejects empty name with 400', async () => {
    const req = makePatchRequest('sq-1', { name: '' })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'sq-1' }) })

    expect(res.status).toBe(400)
    expect(vi.mocked(prisma.searchQuery.update)).not.toHaveBeenCalled()
  })

  it('rejects query longer than 500 chars with 400', async () => {
    const req = makePatchRequest('sq-1', { query: 'q'.repeat(501) })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'sq-1' }) })

    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed JSON', async () => {
    const req = new Request('http://localhost/api/config/search-queries/sq-1', {
      method: 'PATCH',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'sq-1' }) })

    expect(res.status).toBe(400)
  })

  it('rejects empty body with 400', async () => {
    const req = makePatchRequest('sq-1', {})
    const res = await PATCH(req, { params: Promise.resolve({ id: 'sq-1' }) })

    expect(res.status).toBe(400)
    expect(vi.mocked(prisma.searchQuery.update)).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/config/search-queries/[id]', () => {
  it('deletes record and returns 200 with success', async () => {
    vi.mocked(prisma.searchQuery.delete).mockResolvedValueOnce(mockQuery)
    const req = makeDeleteRequest('sq-1')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'sq-1' }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
  })

  it('returns 404 for missing id', async () => {
    vi.mocked(prisma.searchQuery.delete).mockRejectedValueOnce(
      Object.assign(new Error('Not found'), { code: 'P2025' }),
    )
    const req = makeDeleteRequest('nonexistent')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'nonexistent' }) })

    expect(res.status).toBe(404)
  })
})
