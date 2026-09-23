import { expect, test } from '@playwright/test'
import { chooseSelect, gap } from './helpers'

test('[COMP-01] catalog loads', async ({ page }) => {
  await page.goto('/companies')
  await expect(page.getByRole('heading', { name: 'Digital Lab' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'TechFlow' })).toBeVisible()
})

test('[COMP-02] search by name', async ({ page }) => {
  await page.goto('/companies')
  await page.getByRole('textbox', { name: 'Поиск компаний' }).fill('TechFlow')
  await expect(page.getByRole('heading', { name: 'TechFlow' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'PackPro' })).toHaveCount(0)
})

test('[COMP-03] services filter changes the list', async ({ page }) => {
  await page.goto('/companies')
  await expect(page.getByRole('heading', { name: 'Digital Lab' })).toBeVisible()
  await page.getByLabel('Услуги').fill('Фулфилмент')
  await expect(page.getByRole('heading', { name: 'Logistics One' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Digital Lab' })).toHaveCount(0)
})

test('[COMP-04] industry filter', async ({ page }) => {
  await page.goto('/companies')
  await expect(page.getByRole('heading', { name: 'TechFlow' })).toBeVisible()
  await chooseSelect(page, 'Отрасль', 'Healthcare')
  await expect(page.getByRole('heading', { name: 'Digital Lab' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'TechFlow' })).toHaveCount(0)
})

test('[COMP-05] technology filter', async ({ page }) => {
  await page.goto('/companies')
  await expect(page.getByRole('heading', { name: 'TechFlow' })).toBeVisible()
  await page.getByLabel('Технологии').fill('FastAPI')
  await expect(page.getByRole('heading', { name: 'Digital Lab' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'TechFlow' })).toHaveCount(0)
})

test('[COMP-06] region filter', async ({ page }) => {
  await page.goto('/companies')
  await expect(page.getByRole('heading', { name: 'Digital Lab' })).toBeVisible()
  await chooseSelect(page, 'Регион', 'Санкт-Петербург')
  await expect(page.getByRole('heading', { name: 'TechFlow' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Digital Lab' })).toHaveCount(0)
})

test('[COMP-07] verified only', async ({ page }) => {
  await page.goto('/companies')
  await expect(page.getByRole('heading', { name: 'МедСнаб' })).toBeVisible()
  await page.getByRole('checkbox', { name: 'Только verified' }).check()
  await expect(page.getByRole('heading', { name: 'Digital Lab' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'МедСнаб' })).toHaveCount(0)
})

test('[COMP-08] rating filter', async ({ page }) => {
  await page.goto('/companies')
  await expect(page.getByRole('heading', { name: 'TechFlow' })).toBeVisible()
  await page.getByLabel('Рейтинг от').fill('4.7')
  await expect(page.getByRole('heading', { name: 'Digital Lab' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'DataCraft' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'TechFlow' })).toHaveCount(0)
})

test('[COMP-09] combined filters', async ({ page }) => {
  await page.goto('/companies')
  await chooseSelect(page, 'Регион', 'Москва')
  await page.getByRole('checkbox', { name: 'Только verified' }).check()
  await expect(page.getByRole('heading', { name: 'Digital Lab' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'МедСнаб' })).toHaveCount(0)
})

test('[COMP-10] open a company', async ({ page }) => {
  await page.goto('/companies')
  await page.getByRole('textbox', { name: 'Поиск компаний' }).fill('TechFlow')
  await page.getByRole('link', { name: 'Подробнее' }).click()
  await expect(page).toHaveURL(/\/companies\/company-techflow$/)
  await expect(page.getByRole('heading', { level: 1, name: 'TechFlow' })).toBeVisible()
})

test('[COMP-11] [COMP-12] favorite is reflected in favorites', async ({ page }) => {
  await page.goto('/companies/company-cloudnest')
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByRole('button', { name: 'Убрать из избранного' })).toBeVisible()
  await page.goto('/favorites')
  await expect(
    page.getByRole('heading', { name: 'CloudNest' }),
    gap('FAIL', 'сохранение компании не отображается в /favorites'),
  ).toBeVisible()
})
