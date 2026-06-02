import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'

  // Dev: allow eval + inline for HMR; prod: strict nonce
  const scriptSrc = isDev
    ? `script-src 'self' 'unsafe-eval' 'unsafe-inline'`
    : `script-src 'self' 'nonce-${nonce}'`

  // Dev: allow ws/wss for HMR websocket
  const connectSrc = isDev
    ? `connect-src 'self' ws: wss:`
    : `connect-src 'self'`

  return [
    `default-src 'self'`,
    scriptSrc,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    connectSrc,
    `frame-src 'self'`,   // allows same-origin resume PDF iframe
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'self'`,
  ].join('; ')
}

export function proxy(req: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)

  const res = NextResponse.next({ request: { headers: requestHeaders } })

  res.headers.set('Content-Security-Policy', csp)
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
