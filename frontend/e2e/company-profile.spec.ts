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
  await expect(
    page.getByText('Business Automation'),
    gap('FAIL', 'отрасли компании не выводятся в профиле'),
  ).toBeVisible()
})

test('[PROF-04] services', async ({ page }) => {
  await page.goto('/profile/company')
  await expect(page.getByText('Разработка CRM')).toBeVisible()
})

test('[PROF-05] capabilities', async ({ page }) => {
  await page.goto('/profile/company')
  await expect(
    page.getByText('B2B portals'),
    gap('FAIL', 'компетенции не выводятся отдельно от технологий'),
  ).toBeVisible()
})

test('[PROF-06] technologies', async ({ page }) => {
  await page.goto('/profile/company')
  await expect(page.getByText('FastAPI')).toBeVisible()
})

test('[PROF-07] cases', async ({ page }) => {
  await page.goto('/profile/company')
  await expect(
    page.getByText(/24/),
    gap('NOT_IMPLEMENTED', 'кейсы компании в профиле не показаны'),
  ).toBeVisible()
})

test('[PROF-08] verification status', async ({ page }) => {
  await page.goto('/profile/company')
  await expect(page.getByText('Проверена')).toBeVisible()
})

test('[PROF-09] edit permission is enforced by an action', async ({ page }) => {
  await page.goto('/profile/company')
  expect(
    await page.getByRole('textbox').count(),
    gap(
      'NOT_IMPLEMENTED',
      'в сессии только company_owner, формы редактирования нет, запрет для роли без права нечем проверить',
    ),
  ).toBeGreaterThan(0)
})
