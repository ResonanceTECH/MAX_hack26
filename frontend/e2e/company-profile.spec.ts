import { expect, test } from '@playwright/test'
import { gap } from './helpers'

test('[PROF-01] [PROF-02] profile loads the company name', async ({ page }) => {
  await page.goto('/profile/company')
  await expect(page.getByRole('heading', { name: 'Профиль компании' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Digital Lab' })).toBeVisible()
  await expect(page.getByText(/Анна Смирнова/)).toBeVisible()
})

test('[PROF-03] industries', async ({ page }) => {
  await page.goto('/profile/company')
  await expect(page.getByRole('heading', { name: 'Отрасли' })).toBeVisible()
  await expect(page.getByText('Business Automation')).toBeVisible()
})

test('[PROF-04] services', async ({ page }) => {
  await page.goto('/profile/company')
  await expect(page.getByText('Разработка CRM')).toBeVisible()
})

test('[PROF-05] capabilities', async ({ page }) => {
  await page.goto('/profile/company')
  await expect(page.getByRole('heading', { name: 'Компетенции' })).toBeVisible()
  await expect(page.getByText('B2B portals')).toBeVisible()
})

test('[PROF-06] technologies', async ({ page }) => {
  await page.goto('/profile/company')
  await expect(page.getByText('FastAPI')).toBeVisible()
})

test('[PROF-07] cases', async ({ page }) => {
  await page.goto('/profile/company')
  await expect(page.getByText(/Кейсов в профиле:\s*24/)).toBeVisible()
})

test('[PROF-08] verification status', async ({ page }) => {
  await page.goto('/profile/company')
  await expect(page.getByText('Проверена')).toBeVisible()
})

test('[PROF-09] edit is available for company admin', async ({ page }) => {
  await page.goto('/profile/company')
  await expect(page.getByRole('link', { name: 'Редактировать' }).first()).toBeVisible()
  await page.getByRole('link', { name: 'Редактировать' }).first().click()
  await expect(page.getByRole('heading', { name: 'Редактирование компании' })).toBeVisible()
  await expect(page.getByLabel('Описание')).toBeVisible()
  await expect(page.getByLabel('Описание')).toBeEditable()
  expect(
    await page.getByRole('textbox').count(),
    gap('FAIL', 'форма редактирования профиля должна содержать поля'),
  ).toBeGreaterThan(0)
})
