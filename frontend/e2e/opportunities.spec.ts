import { expect, test } from '@playwright/test'
import { chooseSelect, gap } from './helpers'

async function openList(page: import('@playwright/test').Page) {
  await page.goto('/opportunities')
  await expect(page.getByRole('heading', { name: 'Разработка CRM для сети клиник' })).toBeVisible()
}

test('[OPP-01] list loads', async ({ page }) => {
  await openList(page)
  await expect(page.getByRole('heading', { name: 'Внедрение WMS для склада e-commerce' })).toBeVisible()
})

test('[OPP-02] search by title', async ({ page }) => {
  await openList(page)
  await page.getByRole('textbox', { name: 'Поиск возможностей' }).fill('WMS')
  await expect(page.getByRole('heading', { name: 'Внедрение WMS для склада e-commerce' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Серия металлоизделий для станков' })).toHaveCount(0)
})

test('[OPP-03] search by technology', async ({ page }) => {
  await openList(page)
  await page.getByRole('textbox', { name: 'Поиск возможностей' }).fill('Power BI')
  await expect(
    page.getByRole('heading', { name: 'BI-дашборды для сети магазинов' }),
    gap('FAIL', 'строка поиска смотрит title/description/shortName и игнорирует technologies'),
  ).toBeVisible()
})

test('[OPP-04] category filter changes the list', async ({ page }) => {
  await openList(page)
  await chooseSelect(page, 'Категория', 'Логистика')
  await expect(page.getByRole('heading', { name: 'Регулярные FTL-перевозки Урал — Москва' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Разработка CRM для сети клиник' })).toHaveCount(0)
})

test('[OPP-05] industry filter changes the list', async ({ page }) => {
  await openList(page)
  await chooseSelect(page, 'Отрасль', 'Healthcare')
  await expect(page.getByRole('heading', { name: 'Разработка CRM для сети клиник' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Интеграция МИС с лабораторией' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Внедрение WMS для склада e-commerce' })).toHaveCount(0)
})

test('[OPP-06] region filter changes the list', async ({ page }) => {
  await openList(page)
  await chooseSelect(page, 'Регион', 'Екатеринбург')
  await expect(page.getByRole('heading', { name: 'Регулярные FTL-перевозки Урал — Москва' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Разработка CRM для сети клиник' })).toHaveCount(0)
})

test('[OPP-07] budget filter changes the list', async ({ page }) => {
  await openList(page)
  await page.getByLabel('Бюджет от').fill('1600000')
  await expect(page.getByRole('heading', { name: 'Серия металлоизделий для станков' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Разработка CRM для сети клиник' })).toHaveCount(0)
})

test('[OPP-08] technologies filter changes the list', async ({ page }) => {
  await openList(page)
  await page.getByLabel('Технологии').fill('Power BI')
  await expect(page.getByRole('heading', { name: 'BI-дашборды для сети магазинов' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Разработка CRM для сети клиник' })).toHaveCount(0)
})

test('[OPP-09] match score filter changes the list', async ({ page }) => {
  await openList(page)
  await page.getByLabel('Match Score от').fill('96')
  await expect(page.getByRole('heading', { name: 'Регулярные FTL-перевозки Урал — Москва' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Разработка CRM для сети клиник' })).toHaveCount(0)
})

test('[OPP-10] combined filters', async ({ page }) => {
  await openList(page)
  await chooseSelect(page, 'Категория', 'Логистика')
  await chooseSelect(page, 'Регион', 'Екатеринбург')
  await expect(page.getByRole('heading', { name: 'Регулярные FTL-перевозки Урал — Москва' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Мобильное приложение для логистики' })).toHaveCount(0)
})

test('[OPP-11] reset filters restores the list', async ({ page }) => {
  await openList(page)
  await chooseSelect(page, 'Регион', 'Нижний Новгород')
  await expect(page.getByText('Пока нет подходящих заказов')).toBeVisible()
  await page.getByRole('button', { name: 'Сбросить', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Разработка CRM для сети клиник' })).toBeVisible()
})

test('[OPP-12] sort by match', async ({ page }) => {
  await openList(page)
  await page.getByLabel('Сортировка').click()
  await page.getByRole('option', { name: 'Сначала подходящие' }).click()
  const first = page.getByRole('main').locator('h3').filter({ hasNotText: 'Фильтры' }).first()
  await expect(
    first,
    gap('FAIL', 'sort=match возвращает исходный порядок массива и не сортирует по score'),
  ).toHaveText('Регулярные FTL-перевозки Урал — Москва')
})

test('[OPP-13] sort by date', async ({ page }) => {
  await openList(page)
  await page.getByLabel('Сортировка').click()
  await page.getByRole('option', { name: 'Новые' }).click()
  const first = page.getByRole('main').locator('h3').filter({ hasNotText: 'Фильтры' }).first()
  await expect(first).toHaveText('Видеопродакшн для B2B-кампании')
})

test('[OPP-14] empty state', async ({ page }) => {
  await openList(page)
  await chooseSelect(page, 'Регион', 'Нижний Новгород')
  await expect(page.getByText('Пока нет подходящих заказов')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Сбросить фильтры' })).toBeVisible()
})
