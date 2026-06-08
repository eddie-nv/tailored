import { test, expect } from '@playwright/test'

// Run against: pnpm dev (http://localhost:3000)
// Setup: pnpm --filter @tailored/web add -D @playwright/test && npx playwright install chromium

test.describe('Scanner config — SearchFiltersTile', () => {
  test('set min score and see save indicator', async ({ page }) => {
    await page.goto('/?open=scanner')
    await page.waitForSelector('[data-testid="min-score-select"]')
    await page.selectOption('[data-testid="min-score-select"]', 'B')
    await expect(page.locator('[data-testid="save-indicator"]')).toContainText('Saved')
  })

  test('add location allow tag', async ({ page }) => {
    await page.goto('/?open=scanner')
    await page.waitForSelector('[data-testid="location-allow-input"]')
    await page.click('[data-testid="location-allow-input"] input')
    await page.keyboard.type('Remote')
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-testid="location-allow-input"]')).toContainText('Remote')
  })
})

test.describe('Scanner config — TargetsTile', () => {
  test('Ashby preset row is visible', async ({ page }) => {
    await page.goto('/?open=scanner')
    await expect(page.locator('[data-testid="preset-ashby"]')).toBeVisible()
  })

  test('toggle Ashby preset and see save indicator', async ({ page }) => {
    await page.goto('/?open=scanner')
    await page.waitForSelector('[data-testid="preset-ashby-toggle"]')
    await page.click('[data-testid="preset-ashby-toggle"]')
    await expect(page.locator('[data-testid="save-indicator"]').first()).toContainText('Saved')
  })

  test('add websearch target shows Search badge', async ({ page }) => {
    await page.goto('/?open=scanner')
    await page.fill('[placeholder="e.g. Anthropic"]', 'Lindy')
    await page.fill('[placeholder="https://…"]', 'https://www.lindy.ai/careers')
    await page.selectOption('[data-testid="method-select"]', 'websearch')
    await expect(page.locator('[placeholder*="site:"]')).toBeVisible()
    await page.fill('[placeholder*="site:"]', 'site:lindy.ai jobs')
    await page.click('text=+ Add target')
    await expect(page.locator('text=Lindy')).toBeVisible()
    await expect(page.locator('text=Search').first()).toBeVisible()
  })

  test('add auto target with detectable ATS shows API badge', async ({ page }) => {
    await page.goto('/?open=scanner')
    await page.fill('[placeholder="e.g. Anthropic"]', 'Vercel')
    await page.fill('[placeholder="https://…"]', 'https://job-boards.greenhouse.io/vercel')
    await page.click('text=+ Add target')
    await expect(page.locator('text=Vercel')).toBeVisible()
    await expect(page.locator('text=API').first()).toBeVisible()
  })
})

test.describe('Scanner config — DiscoveryQueriesTile', () => {
  test('add a query and see it in the list', async ({ page }) => {
    await page.goto('/?open=scanner')
    await page.fill('[placeholder*="Query name"]', 'AI Engineer — Ashby')
    await page.locator('textarea[placeholder*="site:"]').fill(
      'site:jobs.ashbyhq.com "AI Engineer" remote',
    )
    await page.click('button:has-text("+ Add query")')
    await expect(page.locator('text=AI Engineer — Ashby')).toBeVisible()
  })

  test('open preset library', async ({ page }) => {
    await page.goto('/?open=scanner')
    await page.click('button:has-text("Presets")')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/preset library/i)).toBeVisible()
  })

  test('import a preset from the library', async ({ page }) => {
    await page.goto('/?open=scanner')
    await page.click('button:has-text("Presets")')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: /import/i }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
