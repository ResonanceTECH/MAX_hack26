import { expect, test } from '@playwright/test'
import { cardWithAction, gap } from './helpers'

test('[FAV-01] [FAV-03] save an opportunity and see it with a company', async ({ page }) => {
  await page.goto('/opportunities/opp-mobile-app')
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByRole('button', { name: 'Убрать из избранного' })).toBeVisible()
  await page.goto('/companies/company-cloudnest')
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await page.goto('/favorites')
  await expect(
    page.getByRole('heading', { name: 'CloudNest' }),
    gap('FAIL', 'сохранение компании не отображается в /favorites'),
  ).toBeVisible()
  await page.getByRole('tab', { name: 'Возможности' }).click()
  await expect(page.getByRole('heading', { name: 'Мобильное приложение для логистики' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Разработка CRM для сети клиник' })).toBeVisible()
})

test('[FAV-04] [FAV-05] remove an opportunity and a company', async ({ page }) => {
  await page.goto('/favorites')
  await page.getByRole('tab', { name: 'Возможности' }).click()
  await expect(page.getByRole('heading', { name: 'Разработка CRM для сети клиник' })).toBeVisible()
  const opportunity = cardWithAction(page, 'Разработка CRM для сети клиник', 'Убрать из избранного')
  await opportunity.getByRole('button', { name: 'Убрать из избранного' }).click()
  await expect(page.getByRole('heading', { name: 'Разработка CRM для сети клиник' })).toHaveCount(0)
  await page.getByRole('tab', { name: 'Компании' }).click()
  await expect(page.getByRole('heading', { name: 'TechFlow' })).toBeVisible()
  const company = cardWithAction(page, 'TechFlow', 'Убрать из избранного')
  await company.getByRole('button', { name: 'Убрать из избранного' }).click()
  await expect(page.getByRole('heading', { name: 'TechFlow' })).toHaveCount(0)
})

test('[FAV-06] empty state', async ({ page }) => {
  await page.goto('/favorites')
  await expect(page.getByRole('heading', { name: 'TechFlow' })).toBeVisible()
  for (const tab of ['Компании', 'Возможности']) {
    await page.getByRole('tab', { name: tab }).click()
    const remove = page.getByRole('button', { name: 'Убрать из избранного' })
    while ((await remove.count()) > 0) {
      const before = await remove.count()
      await remove.first().click()
      await expect(remove).toHaveCount(before - 1)
    }
  }
  await page.getByRole('tab', { name: 'Компании' }).click()
  await expect(page.getByText('Нет сохранённых компаний')).toBeVisible()
  await page.getByRole('tab', { name: 'Возможности' }).click()
  await expect(page.getByText('Нет сохранённых возможностей')).toBeVisible()
})
