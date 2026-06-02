import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: 'file:./prisma/test.db',
    },
    globalSetup: './src/__tests__/setup.ts',
    pool: 'forks',
  },
})
