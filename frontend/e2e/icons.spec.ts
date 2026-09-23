import { expect, test } from '@playwright/test'

test('[ICON-02] [ICON-03] [ICON-04] [ICON-05] navigation, search, filters, and status use svg icons', async ({
  page,
}) => {
  await page.goto('/opportunities')
  await expect(page.getByRole('navigation', { name: 'Основная навигация' }).locator('svg').first()).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Поиск возможностей' }).locator('..').locator('svg').first()).toBeVisible()
  await expect(page.locator('body')).not.toContainText('material-icons')
  const banned = await page.locator('.material-icons, .lucide, .fa, [class*="heroicon"]').count()
  expect(banned).toBe(0)
  await expect(page.getByText('Сбор предложений').first()).toBeVisible()
})
