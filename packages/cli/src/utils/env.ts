export function validateEnv(): void {
  if (!process.env['ANTHROPIC_API_KEY']) {
    console.error('Error: ANTHROPIC_API_KEY is not set.')
    console.error('Add it to .env.local or export it in your shell.')
    process.exit(2)
  }
}
