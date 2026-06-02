const DEV_ORIGIN = 'http://localhost:3000'

function getAllowedOrigin(): string {
  return process.env['ALLOWED_ORIGIN'] ?? DEV_ORIGIN
}

export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export function handlePreflight(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null
  return new Response(null, { status: 204, headers: corsHeaders() })
}
