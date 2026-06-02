export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (!process.env['ANTHROPIC_API_KEY']) {
      throw new Error(
        '[tailored] ANTHROPIC_API_KEY is not set. ' +
          'Copy .env.example to apps/web/.env.local and set your Anthropic API key.',
      )
    }
  }
}
