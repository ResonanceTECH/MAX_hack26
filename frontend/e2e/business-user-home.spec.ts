import { expect, test } from '@playwright/test'
import { cardByHeading, gap, sectionByHeading } from './helpers'

const CRM = 'Разработка CRM для сети клиник'
const WMS = 'Внедрение WMS для склада e-commerce'

test('[HOME-01] hero title', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Что нужно вашему бизнесу?' })).toBeVisible()
})

test('[HOME-02] quick actions', async ({ page }) => {
  await page.goto('/')
  const main = page.getByRole('main')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  for (const label of ['Найти исполнителя', 'Найти поставщика', 'Найти заказ', 'Создать запрос']) {
    await expect(main.getByRole('link', { name: label })).toBeVisible()
  }
  await expect(main.getByRole('link', { name: 'Найти исполнителя' })).toHaveAttribute('href', '/companies')
  await expect(main.getByRole('link', { name: 'Найти поставщика' })).toHaveAttribute(
    'href',
    '/companies?focus=supply',
  )
  await expect(main.getByRole('link', { name: 'Найти заказ' })).toHaveAttribute('href', '/opportunities')
  await expect(main.getByRole('link', { name: 'Создать запрос' })).toHaveAttribute(
    'href',
    '/opportunities/create',
  )
})

test('[HOME-03] for-you block', async ({ page }) => {
  await page.goto('/')
  await expect(sectionByHeading(page, 'Для вас')).toBeVisible()
})

test('[HOME-04] recommendation card has Match Score', async ({ page }) => {
  await page.goto('/')
  const card = cardByHeading(page, CRM)
  await expect(card.getByRole('button', { name: /Match Score 94/ })).toBeVisible()
})

test('[HOME-05] why it fits opens', async ({ page }) => {
  await page.goto('/')
  const card = cardByHeading(page, CRM)
  await card.getByRole('button', { name: /Match Score 94/ }).click()
  await expect(page.getByRole('dialog')).toContainText(/Почему подходит/)
  await expect(page.getByRole('dialog')).toContainText('Есть опыт Healthcare')
})

test('[HOME-06] details open the same opportunity', async ({ page }) => {
  await page.goto('/')
  await cardByHeading(page, CRM).getByRole('link', { name: 'Подробнее' }).click()
  await expect(page).toHaveURL(/\/opportunities\/opp-crm-clinics$/)
  await expect(page.getByRole('heading', { level: 1, name: CRM })).toBeVisible()
})

test('[HOME-07] save adds the opportunity to favorites', async ({ page }) => {
  await page.goto('/')
  const card = cardByHeading(page, WMS)
  await card.getByRole('button', { name: 'Сохранить' }).click()
  await expect(card.getByRole('button', { name: 'Убрать из избранного' })).toBeVisible()
  await page.goto('/favorites')
  await page.getByRole('tab', { name: 'Возможности' }).click()
  await expect(
    page.getByRole('heading', { name: WMS }),
    gap('FAIL', 'сохранение с главной не появляется в /favorites'),
  ).toBeVisible()
})

test('[HOME-08] not interested changes state beyond the current render', async ({ page }) => {
  await page.goto('/')
  await cardByHeading(page, CRM).getByRole('button', { name: 'Не интересно' }).click()
  await expect(page.getByRole('heading', { name: CRM })).toHaveCount(0)
  await page.goto('/opportunities')
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Что нужно вашему бизнесу?' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Для вас' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: CRM }),
    gap('FAIL', '«Не интересно» хранится в useState страницы и сбрасывается при уходе с главной'),
  ).toHaveCount(0)
})

test('[HOME-09] own requests are listed', async ({ page }) => {
  await page.goto('/')
  const section = sectionByHeading(page, 'Ваши запросы')
  await expect(section.getByRole('heading', { name: 'Партнёр по дистрибуции ПО в регионах' })).toBeVisible()
  await expect(section.getByRole('heading', { name: 'Разработка интернет-магазина' })).toBeVisible()
})

test('[HOME-10] a proposal opens the matching proposal', async ({ page }) => {
  await page.goto('/')
  const section = sectionByHeading(page, 'Новые предложения')
  const link = section.getByRole('link', { name: 'Подробнее' }).first()
  await expect(link).toHaveAttribute('href', '/proposals/prop-1')
  await link.click()
  await expect(page).toHaveURL(/\/proposals\/prop-1$/)
  await expect(page.getByText(/MVP CRM за 8 недель/)).toBeVisible()
})

test('[HOME-11] continue-work links point at the current process', async ({ page }) => {
  await page.goto('/')
  const section = sectionByHeading(page, 'Продолжить работу')
  await expect(section.getByRole('link', { name: /Сравнить предложения/ })).toHaveAttribute(
    'href',
    '/opportunities/opp-partner-distribution/compare',
  )
  await expect(section.getByRole('link', { name: /Shortlist/ })).toHaveAttribute('href', '/my/shortlist')
  await expect(section.getByRole('link', { name: /Переговоры с Digital Lab/ })).toHaveAttribute(
    'href',
    '/deals/deal-1',
  )
})
