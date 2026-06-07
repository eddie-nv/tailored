import { test, expect } from '@playwright/test'

// Run against: pnpm dev (http://localhost:3000)
// Setup: pnpm add -D @playwright/test && npx playwright install chromium

test.describe('Scanner config section', () => {
  test('broad discovery toggles — enable Ashby', async ({ page }) => {
    await page.goto('/?open=scanner')
    await page.waitForLoadState('networkidle')

    const ashbySwitch = page.getByRole('switch', { name: /enable ashby/i })
    await expect(ashbySwitch).toBeVisible()
    await ashbySwitch.click()
    await expect(ashbySwitch).toBeChecked()
  })

  test('company watchlist — add custom portal', async ({ page }) => {
    await page.goto('/?open=scanner')
    await page.waitForLoadState('networkidle')

    await page.fill('[placeholder*="Anthropic"]', 'Acme Corp')
    await page.fill('[placeholder*="https://"]', 'https://jobs.ashbyhq.com/acme')
    await page.click('button:has-text("+ Add portal")')

    await expect(page.locator('text=Acme Corp')).toBeVisible()
    await expect(page.locator('text=Ashby').first()).toBeVisible()
  })

  test('discovery queries — add search query', async ({ page }) => {
    await page.goto('/?open=scanner')
    await page.waitForLoadState('networkidle')

    await page.fill('[placeholder*="Query name"]', 'Test Query')
    await page.locator('textarea[placeholder*="site:"]').fill(
      'site:jobs.ashbyhq.com "AI Engineer" remote',
    )
    await page.click('button:has-text("+ Add query")')

    await expect(page.locator('text=Test Query')).toBeVisible()
  })

  test('discovery queries — open preset library', async ({ page }) => {
    await page.goto('/?open=scanner')
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("Presets")')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/preset library/i)).toBeVisible()
  })

  test('discovery queries — import preset', async ({ page }) => {
    await page.goto('/?open=scanner')
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("Presets")')
    await expect(page.getByRole('dialog')).toBeVisible()

    const importBtns = page.getByRole('button', { name: /import/i })
    await importBtns.first().click()

    // Dialog stays open; new query should appear in the list
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
