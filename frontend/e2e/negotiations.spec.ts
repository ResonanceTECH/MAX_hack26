import { expect, test } from '@playwright/test'

test('[DEAL-01] [DEAL-02] [DEAL-03] [DEAL-07] customer, contractor, request, negotiation', async ({
  page,
}) => {
  await page.goto('/deals/deal-1')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Digital Lab × МедСнаб')
  await expect(page.getByText('Разработка CRM для сети клиник').first()).toBeVisible()
  const overview = page.getByText('Заказчик').locator('xpath=..')
  await expect(overview).toContainText('МедСнаб')
  await expect(page.getByText('Исполнитель').locator('xpath=..')).toContainText('Digital Lab')
  await expect(page.getByText('Переговоры').first()).toBeVisible()
})

test('[DEAL-04] [DEAL-05] [DEAL-06] proposal, price, and duration are kept', async ({ page }) => {
  await page.goto('/deals/deal-1')
  await expect(page.getByText(/480\s*000/)).toBeVisible()
  await expect(page.getByText('60 дн.')).toBeVisible()
  await page.getByRole('tab', { name: 'Предложение' }).click()
  await expect(page.getByText(/MVP CRM за 8 недель/)).toBeVisible()
  await page.getByRole('link', { name: 'Открыть полное предложение' }).click()
  await expect(page).toHaveURL(/\/proposals\/prop-1$/)
})

test('[DEAL-08] [DEAL-09] tabs and timeline', async ({ page }) => {
  await page.goto('/deals/deal-1')
  for (const name of ['Обзор', 'Предложение', 'Файлы', 'История']) {
    await expect(page.getByRole('tab', { name })).toBeVisible()
  }
  await page.getByRole('tab', { name: 'Файлы' }).click()
  await expect(page.getByText('Файлов пока нет')).toBeVisible()
  await page.getByRole('tab', { name: 'История' }).click()
  await expect(page.getByText('Получено предложение')).toBeVisible()
  await expect(page.getByText('Компания добавлена в shortlist')).toBeVisible()
  await expect(page.getByText('Начаты переговоры')).toBeVisible()
})

test('[DEAL-11] MAX chat has a safe fallback', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  let message = ''
  page.once('dialog', async (dialog) => {
    message = dialog.message()
    await dialog.accept()
  })
  await page.goto('/deals/deal-1')
  await page.getByRole('button', { name: 'Открыть чат в MAX' }).click()
  await expect.poll(() => message).toMatch(/MAX/)
  expect(pageErrors).toEqual([])
})
