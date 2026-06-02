import { execSync } from 'child_process'
import { rm } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const PACKAGE_ROOT = path.resolve(import.meta.dirname, '../../')
const TEST_DB = path.join(PACKAGE_ROOT, 'prisma/test.db')
const TEST_DB_ENV = 'file:./prisma/test.db'

export async function setup() {
  // Start from a clean slate on every test run
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    if (existsSync(`${TEST_DB}${suffix}`)) {
      await rm(`${TEST_DB}${suffix}`, { force: true })
    }
  }

  execSync('prisma migrate deploy', {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: TEST_DB_ENV },
    cwd: PACKAGE_ROOT,
  })
}

export async function teardown() {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    await rm(`${TEST_DB}${suffix}`, { force: true })
  }
}
