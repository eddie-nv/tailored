import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH, DELETE } from '../route'
import { prisma } from '@tailored/db/client'

vi.mock('@tailored/db/client', () => ({
  prisma: {
    customPortal: {
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

const mockPortal = {
  id: 'portal-1',
  name: 'Linear',
  url: 'https://linear.ashbyhq.com/jobs',
  enabled: true,
  provider: null,
  api: null,
  method: 'auto',
  query: null,
  notes: null,
  createdAt: new Date(),
}

function makePatchRequest(id: string, body: unknown) {
  return new Request(`http://localhost/api/config/portals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeDeleteRequest(id: string) {
  return new Request(`http://localhost/api/config/portals/${id}`, {
    method: 'DELETE',
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PATCH /api/config/portals/[id]', () => {
  it('accepts provider override and persists to DB', async () => {
    vi.mocked(prisma.customPortal.update).mockResolvedValueOnce({
      ...mockPortal,
      provider: 'Greenhouse',
    })
    const req = makePatchRequest('portal-1', { provider: 'Greenhouse' })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'portal-1' }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(vi.mocked(prisma.customPortal.update)).toHaveBeenCalledWith({
      where: { id: 'portal-1' },
      data: expect.objectContaining({ provider: 'Greenhouse' }),
    })
  })

  it('accepts api URL and persists to DB', async () => {
    vi.mocked(prisma.customPortal.update).mockResolvedValueOnce({
      ...mockPortal,
      api: 'https://boards-api.greenhouse.io/v1/boards/acme',
    })
    const req = makePatchRequest('portal-1', {
      api: 'https://boards-api.greenhouse.io/v1/boards/acme',
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'portal-1' }) })

    expect(res.status).toBe(200)
  })

  it('rejects non-https api URL with 400', async () => {
    const req = makePatchRequest('portal-1', { api: 'http://insecure.example.com/jobs' })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'portal-1' }) })

    expect(res.status).toBe(400)
    expect(vi.mocked(prisma.customPortal.update)).not.toHaveBeenCalled()
  })

  it('accepts notes up to 200 chars', async () => {
    const notes = 'a'.repeat(200)
    vi.mocked(prisma.customPortal.update).mockResolvedValueOnce({ ...mockPortal, notes })
    const req = makePatchRequest('portal-1', { notes })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'portal-1' }) })

    expect(res.status).toBe(200)
  })

  it('rejects notes longer than 200 chars with 400', async () => {
    const req = makePatchRequest('portal-1', { notes: 'a'.repeat(201) })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'portal-1' }) })

    expect(res.status).toBe(400)
    expect(vi.mocked(prisma.customPortal.update)).not.toHaveBeenCalled()
  })

  it('preserves existing enabled toggle behaviour', async () => {
    vi.mocked(prisma.customPortal.update).mockResolvedValueOnce({ ...mockPortal, enabled: false })
    const req = makePatchRequest('portal-1', { enabled: false })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'portal-1' }) })

    expect(res.status).toBe(200)
  })

  it('accepts null provider to clear the override', async () => {
    vi.mocked(prisma.customPortal.update).mockResolvedValueOnce({ ...mockPortal, provider: null })
    const req = makePatchRequest('portal-1', { provider: null })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'portal-1' }) })

    expect(res.status).toBe(200)
  })

  it('updates method from auto to websearch with a query', async () => {
    vi.mocked(prisma.customPortal.update).mockResolvedValueOnce({
      ...mockPortal,
      method: 'websearch',
      query: 'site:acme.com/careers engineer',
    })
    const req = makePatchRequest('portal-1', {
      method: 'websearch',
      query: 'site:acme.com/careers engineer',
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'portal-1' }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data).toMatchObject({ method: 'websearch', query: 'site:acme.com/careers engineer' })
    expect(vi.mocked(prisma.customPortal.update)).toHaveBeenCalledWith({
      where: { id: 'portal-1' },
      data: expect.objectContaining({ method: 'websearch', query: 'site:acme.com/careers engineer' }),
    })
  })

  it('updates query string on existing websearch entry', async () => {
    vi.mocked(prisma.customPortal.update).mockResolvedValueOnce({
      ...mockPortal,
      method: 'websearch',
      query: 'new query string',
    })
    const req = makePatchRequest('portal-1', { query: 'new query string' })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'portal-1' }) })

    expect(res.status).toBe(200)
    expect(vi.mocked(prisma.customPortal.update)).toHaveBeenCalledWith({
      where: { id: 'portal-1' },
      data: expect.objectContaining({ query: 'new query string' }),
    })
  })

  it('clears query to null on a method=auto entry', async () => {
    vi.mocked(prisma.customPortal.update).mockResolvedValueOnce({
      ...mockPortal,
      method: 'auto',
      query: null,
    })
    const req = makePatchRequest('portal-1', { method: 'auto', query: null })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'portal-1' }) })

    expect(res.status).toBe(200)
    expect(vi.mocked(prisma.customPortal.update)).toHaveBeenCalledWith({
      where: { id: 'portal-1' },
      data: expect.objectContaining({ method: 'auto', query: null }),
    })
  })

  it('rejects unknown method value with 400', async () => {
    const req = makePatchRequest('portal-1', { method: 'scrape' })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'portal-1' }) })

    expect(res.status).toBe(400)
    expect(vi.mocked(prisma.customPortal.update)).not.toHaveBeenCalled()
  })

  it('rejects query longer than 500 chars with 400', async () => {
    const req = makePatchRequest('portal-1', { query: 'a'.repeat(501) })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'portal-1' }) })

    expect(res.status).toBe(400)
    expect(vi.mocked(prisma.customPortal.update)).not.toHaveBeenCalled()
  })

  it('rejects unknown fields with 400', async () => {
    const req = makePatchRequest('portal-1', { unknownField: 'value' })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'portal-1' }) })

    expect(res.status).toBe(400)
  })

  it('rejects empty body with 400', async () => {
    const req = makePatchRequest('portal-1', {})
    const res = await PATCH(req, { params: Promise.resolve({ id: 'portal-1' }) })

    expect(res.status).toBe(400)
    expect(vi.mocked(prisma.customPortal.update)).not.toHaveBeenCalled()
  })

  it('returns 404 for missing portal id', async () => {
    vi.mocked(prisma.customPortal.update).mockRejectedValueOnce(
      Object.assign(new Error('Not found'), { code: 'P2025' }),
    )
    const req = makePatchRequest('nonexistent', { enabled: true })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) })

    expect(res.status).toBe(404)
  })

  it('returns 400 for malformed JSON', async () => {
    const req = new Request('http://localhost/api/config/portals/portal-1', {
      method: 'PATCH',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'portal-1' }) })

    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/config/portals/[id]', () => {
  it('deletes portal and returns 204', async () => {
    vi.mocked(prisma.customPortal.delete).mockResolvedValueOnce(mockPortal)
    const req = makeDeleteRequest('portal-1')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'portal-1' }) })

    expect(res.status).toBe(204)
  })

  it('returns 404 for missing portal id', async () => {
    vi.mocked(prisma.customPortal.delete).mockRejectedValueOnce(
      Object.assign(new Error('Not found'), { code: 'P2025' }),
    )
    const req = makeDeleteRequest('nonexistent')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'nonexistent' }) })

    expect(res.status).toBe(404)
  })
})
