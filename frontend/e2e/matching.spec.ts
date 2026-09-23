import { expect, test } from '@playwright/test'
import { gap } from './helpers'

test('[MATCH-01] [MATCH-02] [MATCH-08] score and explanation are both on the detail screen', async ({
  page,
}) => {
  await page.goto('/opportunities/opp-crm-clinics')
  const score = page.getByText(/94% соответствия/)
  await expect(score).toBeVisible()
  const value = Number((await score.innerText()).match(/\d+/)?.[0])
  expect(value).toBeGreaterThanOrEqual(0)
  expect(value).toBeLessThanOrEqual(100)
  await expect(page.getByText('Почему подходит вам')).toBeVisible()
})

test('[MATCH-03] [MATCH-04] [MATCH-05] reasons and gaps belong to this request', async ({
  page,
}) => {
  await page.goto('/opportunities/opp-crm-clinics')
  await expect(page.getByText('Есть опыт Healthcare')).toBeVisible()
  await expect(page.getByText(/ISO 27001/)).toBeVisible()
  await expect(page.getByText('Профиль FTL')).toHaveCount(0)
})

test('[MATCH-06] another entity does not reuse this explanation', async ({ page }) => {
  await page.goto('/companies/company-packpro?fromOpportunity=opp-packaging-supply')
  await expect(page.getByText('Производство упаковки')).toBeVisible()
  await expect(page.getByText('Есть опыт Healthcare')).toHaveCount(0)
})

test('[MATCH-07] hide does not only pretend to dismiss', async ({ page }) => {
  let message = ''
  page.once('dialog', async (dialog) => {
    message = dialog.message()
    await dialog.accept()
  })
  await page.goto('/opportunities/opp-crm-clinics')
  await page.getByRole('button', { name: 'Скрыть' }).click()
  await expect.poll(() => message).toMatch(/Mock/)
  await expect(page.getByRole('heading', { name: 'Разработка CRM для сети клиник' })).toBeVisible()
  await page.goto('/opportunities')
  await page.goto('/opportunities/opp-crm-clinics')
  await expect(
    page.getByRole('link', { name: 'Предложить решение' }),
    gap('FAIL', '«Скрыть» только показывает alert и не меняет рекомендацию'),
  ).toHaveCount(0)
})
