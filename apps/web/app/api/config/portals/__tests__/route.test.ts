import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../route'
import { prisma } from '@tailored/db/client'

vi.mock('@tailored/db/client', () => ({
  prisma: {
    customPortal: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

const mockPortal = {
  id: 'portal-1',
  name: 'Acme Corp',
  url: 'https://acme.ashbyhq.com/jobs',
  enabled: true,
  provider: null,
  api: null,
  method: 'auto',
  query: null,
  notes: null,
  createdAt: new Date(),
}

function makePostRequest(body: unknown) {
  return new Request('http://localhost/api/config/portals', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/config/portals', () => {
  it('returns portals list with method and query fields', async () => {
    vi.mocked(prisma.customPortal.findMany).mockResolvedValueOnce([mockPortal])
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data[0]).toMatchObject({ method: 'auto', query: null })
  })
})

describe('POST /api/config/portals', () => {
  it('creates portal with method: "auto" by default', async () => {
    vi.mocked(prisma.customPortal.create).mockResolvedValueOnce(mockPortal)
    const req = makePostRequest({ name: 'Acme Corp', url: 'https://acme.ashbyhq.com/jobs' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.success).toBe(true)
    expect(vi.mocked(prisma.customPortal.create)).toHaveBeenCalledWith({
      data: expect.objectContaining({ method: 'auto' }),
    })
  })

  it('creates portal with method: "websearch" and query', async () => {
    vi.mocked(prisma.customPortal.create).mockResolvedValueOnce({
      ...mockPortal,
      method: 'websearch',
      query: 'site:acme.com/careers software engineer',
    })
    const req = makePostRequest({
      name: 'Acme Corp',
      url: 'https://acme.com',
      method: 'websearch',
      query: 'site:acme.com/careers software engineer',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.data).toMatchObject({
      method: 'websearch',
      query: 'site:acme.com/careers software engineer',
    })
  })

  it('rejects query longer than 500 chars with 400', async () => {
    const req = makePostRequest({
      name: 'Acme Corp',
      url: 'https://acme.com',
      method: 'websearch',
      query: 'a'.repeat(501),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    expect(vi.mocked(prisma.customPortal.create)).not.toHaveBeenCalled()
  })

  it('accepts method: "auto" with no query (null)', async () => {
    vi.mocked(prisma.customPortal.create).mockResolvedValueOnce(mockPortal)
    const req = makePostRequest({
      name: 'Acme Corp',
      url: 'https://acme.com',
      method: 'auto',
    })
    const res = await POST(req)

    expect(res.status).toBe(201)
    expect(vi.mocked(prisma.customPortal.create)).toHaveBeenCalledWith({
      data: expect.objectContaining({ method: 'auto' }),
    })
  })

  it('rejects unknown method value with 400', async () => {
    const req = makePostRequest({
      name: 'Acme Corp',
      url: 'https://acme.com',
      method: 'scrape',
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    expect(vi.mocked(prisma.customPortal.create)).not.toHaveBeenCalled()
  })

  it('rejects non-https URL with 400', async () => {
    const req = makePostRequest({ name: 'Acme Corp', url: 'http://acme.com' })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed JSON', async () => {
    const req = new Request('http://localhost/api/config/portals', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })
})
