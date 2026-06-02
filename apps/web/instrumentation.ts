export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (!process.env['ANTHROPIC_API_KEY']) {
      const msg =
        '[tailored] ANTHROPIC_API_KEY is not set. ' +
        'Add it to apps/web/.env.local — agent calls will fail without it.'
      if (process.env.NODE_ENV === 'production') {
        throw new Error(msg)
      } else {
        console.warn(msg)
      }
    }
  }
}
