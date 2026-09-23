import { expect, test } from '@playwright/test'
import { gap, horizontalOverflow } from './helpers'

async function openCompare(page: import('@playwright/test').Page) {
  await page.goto('/opportunities/opp-crm-clinics/compare')
  await expect(page.getByRole('heading', { name: 'Сравнение предложений' })).toBeVisible()
}

test('[CMP-01] [CMP-02] [CMP-03] comparison requires an explicit selection', async ({ page }) => {
  await openCompare(page)
  await expect(
    page.getByRole('checkbox'),
    gap('NOT_IMPLEMENTED', 'нельзя выбрать 2 или 3 предложения: таблица сразу показывает все'),
  ).not.toHaveCount(0)
})

test('[CMP-04] [CMP-05] [CMP-06] [CMP-07] [CMP-08] [CMP-09] values stay with the right company', async ({
  page,
}) => {
  await openCompare(page)
  const headers = page.getByRole('columnheader')
  await expect(headers.nth(1)).toHaveText('Digital Lab')
  await expect(headers.nth(2)).toHaveText('TechFlow')
  await expect(headers.nth(3)).toHaveText('DataCraft')
  const price = page.getByRole('row', { name: /Цена/ })
  await expect(price).toContainText(/480\s*000/)
  await expect(price).toContainText(/520\s*000/)
  await expect(price).toContainText(/390\s*000/)
  await expect(page.getByRole('row', { name: /Match Score/ })).toContainText('94')
  await expect(page.getByRole('row', { name: /Срок/ })).toContainText('60')
  await expect(page.getByRole('row', { name: /Срок/ })).toContainText('75')
  await expect(page.getByRole('row', { name: /Рейтинг/ })).toContainText('4.8')
  await expect(page.getByRole('row', { name: /Похожие кейсы/ })).toContainText('2')
})

test('[CMP-10] requirements are compared', async ({ page }) => {
  await openCompare(page)
  await expect(
    page.getByRole('row', { name: /Требования/ }),
    gap('NOT_IMPLEMENTED', 'в сравнении нет строки требований и missing requirements'),
  ).toBeVisible()
})

test('[CMP-11] add to shortlist from comparison', async ({ page }) => {
  await openCompare(page)
  await expect(
    page.getByRole('button', { name: 'В shortlist' }),
    gap('NOT_IMPLEMENTED', 'из сравнения нельзя добавить в shortlist'),
  ).toBeVisible()
})

test('[CMP-12] [CMP-13] remove one proposal from comparison', async ({ page }) => {
  await openCompare(page)
  await expect(
    page.getByRole('button', { name: /убрать из сравнения/i }),
    gap('NOT_IMPLEMENTED', 'предложение нельзя убрать из сравнения'),
  ).toBeVisible()
})

test('[CMP-14] comparison stays usable at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openCompare(page)
  await expect(page.getByRole('table', { name: 'Сравнение предложений' })).toBeVisible()
  expect(await horizontalOverflow(page)).toBe(false)
})
