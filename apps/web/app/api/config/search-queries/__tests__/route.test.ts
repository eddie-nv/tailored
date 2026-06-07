import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../route'
import { prisma } from '@tailored/db/client'

vi.mock('@tailored/db/client', () => ({
  prisma: {
    searchQuery: {
      findMany: vi.fn(),
      create: vi.fn(),
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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/config/search-queries', () => {
  it('returns empty array when no queries exist', async () => {
    vi.mocked(prisma.searchQuery.findMany).mockResolvedValueOnce([])
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data).toEqual([])
  })

  it('returns all queries ordered by createdAt asc', async () => {
    vi.mocked(prisma.searchQuery.findMany).mockResolvedValueOnce([mockQuery])
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(vi.mocked(prisma.searchQuery.findMany)).toHaveBeenCalledWith({
      orderBy: { createdAt: 'asc' },
    })
  })
})

describe('POST /api/config/search-queries', () => {
  it('creates a record and returns 201 with id', async () => {
    vi.mocked(prisma.searchQuery.create).mockResolvedValueOnce(mockQuery)
    const req = new Request('http://localhost/api/config/search-queries', {
      method: 'POST',
      body: JSON.stringify({ name: 'Senior Eng Remote', query: 'senior engineer remote' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.success).toBe(true)
    expect(json.data.id).toBe('sq-1')
  })

  it('rejects empty name with 400', async () => {
    const req = new Request('http://localhost/api/config/search-queries', {
      method: 'POST',
      body: JSON.stringify({ name: '', query: 'engineer' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    expect(vi.mocked(prisma.searchQuery.create)).not.toHaveBeenCalled()
  })

  it('rejects query longer than 500 chars with 400', async () => {
    const req = new Request('http://localhost/api/config/search-queries', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', query: 'q'.repeat(501) }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    expect(vi.mocked(prisma.searchQuery.create)).not.toHaveBeenCalled()
  })

  it('rejects missing query field with 400', async () => {
    const req = new Request('http://localhost/api/config/search-queries', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('rejects malformed JSON with 400', async () => {
    const req = new Request('http://localhost/api/config/search-queries', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })
})
