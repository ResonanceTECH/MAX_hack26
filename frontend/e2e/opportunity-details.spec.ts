import { expect, test } from '@playwright/test'
import { gap } from './helpers'

const CRM = 'Разработка CRM для сети клиник'

async function openCrm(page: import('@playwright/test').Page) {
  await page.goto('/opportunities/opp-crm-clinics')
  await expect(page.getByRole('heading', { level: 1, name: CRM })).toBeVisible()
}

test('[OD-01] title', async ({ page }) => {
  await openCrm(page)
})

test('[OD-02] description', async ({ page }) => {
  await openCrm(page)
  await expect(page.getByText(/карточки пациентов/)).toBeVisible()
})

test('[OD-03] customer', async ({ page }) => {
  await openCrm(page)
  await expect(page.getByText('МедСнаб').first()).toBeVisible()
})

test('[OD-04] verified badge', async ({ page }) => {
  await page.goto('/opportunities/opp-metal-parts')
  await expect(page.getByRole('heading', { level: 1, name: 'Серия металлоизделий для станков' })).toBeVisible()
  await expect(page.getByLabel('Проверенная компания').first()).toBeVisible()
})

test('[OD-05] budget', async ({ page }) => {
  await openCrm(page)
  await expect(page.getByText(/Бюджет:/)).toBeVisible()
  await expect(page.getByText(/350/).first()).toBeVisible()
  await expect(page.getByText(/500/).first()).toBeVisible()
})

test('[OD-06] region', async ({ page }) => {
  await openCrm(page)
  await expect(page.getByText('Москва').first()).toBeVisible()
})

test('[OD-07] execution date', async ({ page }) => {
  await openCrm(page)
  await expect(page.getByText(/Срок выполнения:/)).toBeVisible()
})

test('[OD-08] proposal deadline', async ({ page }) => {
  await openCrm(page)
  await expect(page.getByText(/Дедлайн отклика/)).toBeVisible()
})

test('[OD-09] required requirements', async ({ page }) => {
  await openCrm(page)
  await expect(page.getByRole('heading', { name: 'Обязательные' })).toBeVisible()
  await expect(page.getByText('API integration')).toBeVisible()
})

test('[OD-10] desired requirements', async ({ page }) => {
  await openCrm(page)
  await expect(page.getByRole('heading', { name: 'Желательные' })).toBeVisible()
  await expect(page.getByText('опыт интеграции с 1С')).toBeVisible()
})

test('[OD-11] match score', async ({ page }) => {
  await openCrm(page)
  await expect(page.getByText(/94% соответствия/)).toBeVisible()
})

test('[OD-12] match explanation', async ({ page }) => {
  await openCrm(page)
  await expect(page.getByText('Почему подходит вам')).toBeVisible()
  await expect(page.getByText('Есть опыт Healthcare')).toBeVisible()
})

test('[OD-13] missing requirements', async ({ page }) => {
  await openCrm(page)
  await expect(page.getByText(/ISO 27001/)).toBeVisible()
})

test('[OD-14] opens the customer company', async ({ page }) => {
  await openCrm(page)
  await page.getByRole('link', { name: 'Посмотреть компанию' }).click()
  await expect(page).toHaveURL(/\/companies\/company-medsupply$/)
  await expect(page.getByRole('heading', { level: 1, name: 'МедСнаб' })).toBeVisible()
})

test('[OD-15] favorite toggles', async ({ page }) => {
  await openCrm(page)
  const saved = page.getByRole('button', { name: 'Убрать из избранного' })
  await expect(saved).toBeVisible()
  await saved.click()
  await expect(page.getByRole('button', { name: 'Сохранить' })).toBeVisible()
  await page.goto('/favorites')
  await page.getByRole('tab', { name: 'Возможности' }).click()
  await expect(page.getByRole('heading', { name: CRM })).toHaveCount(0)
})

test('[OD-16] propose solution opens the form', async ({ page }) => {
  await openCrm(page)
  await page.getByRole('link', { name: 'Предложить решение' }).click()
  await expect(page).toHaveURL(/\/opportunities\/opp-crm-clinics\/propose$/)
  await expect(page.getByRole('heading', { name: 'Отклик на запрос' })).toBeVisible()
})

test('[OD-19] own request cannot be answered', async ({ page }) => {
  await page.goto('/opportunities/opp-dl-ecommerce')
  await expect(page.getByRole('link', { name: /Предложения \(7\)/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Предложить решение' })).toHaveCount(0)
  await page.goto('/opportunities/opp-dl-ecommerce/propose')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Отправить предложение' }),
    gap('FAIL', 'карточка своего запроса прячет CTA, но /propose всё равно принимает отклик'),
  ).toHaveCount(0)
})
