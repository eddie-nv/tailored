const WINDOW_MS = 60_000
const RPM = parseInt(process.env['RATE_LIMIT_RPM'] ?? '10', 10)

interface Bucket {
  count: number
  resetAt: number
}

// Per-process in-memory store — sufficient for single-user self-hosted MVP
const store = new Map<string, Bucket>()

function getClientIP(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return 'unknown'
}

export function checkRateLimit(req: Request): Response | null {
  const ip = getClientIP(req)
  const now = Date.now()

  const bucket = store.get(ip)

  if (!bucket || now > bucket.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return null
  }

  if (bucket.count >= RPM) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    })
  }

  bucket.count++
  return null
}
