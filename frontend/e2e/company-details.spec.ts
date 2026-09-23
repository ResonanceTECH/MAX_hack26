import { expect, test } from '@playwright/test'
import { gap } from './helpers'

test('[CD-01] name', async ({ page }) => {
  await page.goto('/companies/company-techflow')
  await expect(page.getByRole('heading', { level: 1, name: 'TechFlow' })).toBeVisible()
  await expect(page.getByText('ООО «TechFlow»')).toBeVisible()
})

test('[CD-02] avatar fallback', async ({ page }) => {
  await page.goto('/companies/company-techflow')
  await expect(page.getByText('T', { exact: true })).toBeVisible()
})

test('[CD-03] verified', async ({ page }) => {
  await page.goto('/companies/company-techflow')
  await expect(page.getByText('Проверена')).toBeVisible()
})

test('[CD-04] rating', async ({ page }) => {
  await page.goto('/companies/company-techflow')
  await expect(page.getByText(/4\.6/)).toBeVisible()
})

test('[CD-05] about', async ({ page }) => {
  await page.goto('/companies/company-techflow')
  await expect(page.getByRole('tab', { name: 'О компании' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText(/full-stack/)).toBeVisible()
})

test('[CD-06] services', async ({ page }) => {
  await page.goto('/companies/company-techflow')
  await page.getByRole('tab', { name: 'Услуги' }).click()
  await expect(page.getByText('Корпоративные порталы')).toBeVisible()
})

test('[CD-07] cases', async ({ page }) => {
  await page.goto('/companies/company-techflow')
  await page.getByRole('tab', { name: 'Кейсы' }).click()
  await expect(
    page.getByText('Детальные кейсы появятся после подключения API.'),
    gap('NOT_IMPLEMENTED', 'вкладка «Кейсы» — заглушка'),
  ).toHaveCount(0)
})

test('[CD-08] capabilities', async ({ page }) => {
  await page.goto('/companies/company-techflow')
  await page.getByRole('tab', { name: 'Компетенции' }).click()
  await expect(page.getByText('Микросервисы')).toBeVisible()
  await expect(page.getByText('Kafka')).toBeVisible()
})

test('[CD-09] documents', async ({ page }) => {
  await page.goto('/companies/company-techflow')
  await page.getByRole('tab', { name: 'Документы' }).click()
  await expect(
    page.getByText(/Документы — после интеграции с backend/),
    gap('NOT_IMPLEMENTED', 'вкладка «Документы» — заглушка'),
  ).toHaveCount(0)
})

test('[CD-10] [CD-11] [CD-12] match in the context of a request', async ({ page }) => {
  await page.goto('/companies/company-techflow?fromOpportunity=opp-crm-clinics')
  await expect(page.getByText(/81% соответствия/)).toBeVisible()
  await expect(page.getByText('Сильный стек React')).toBeVisible()
  await expect(page.getByText('Нет опыта с МИС')).toBeVisible()
  await expect(page.getByText('Есть опыт Healthcare')).toHaveCount(0)
})

test('[CD-13] [CD-14] [CD-15] [CD-16] invite changes state', async ({ page }) => {
  let alertText = ''
  page.once('dialog', async (dialog) => {
    alertText = dialog.message()
    await dialog.accept()
  })
  await page.goto('/companies/company-techflow')
  await expect(page.getByRole('heading', { level: 1, name: 'TechFlow' })).toBeVisible()
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: 'Пригласить в запрос' }).click()
  await expect(page.getByRole('dialog', { name: 'Выберите запрос' })).toBeVisible()
  await page.getByRole('button', { name: /Разработка интернет-магазина/ }).click()
  await expect.poll(() => alertText).toMatch(/Mock/)
  await expect(
    page.getByText(/приглашена/),
    gap('NOT_IMPLEMENTED', 'приглашение заканчивается window.alert и не записывает состояние'),
  ).toBeVisible()
})
