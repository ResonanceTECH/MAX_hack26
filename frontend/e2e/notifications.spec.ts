import { expect, test } from '@playwright/test'
import { gap } from './helpers'

const links = [
  ['Новый подходящий заказ', /\/opportunities\/opp-bi-dashboard$/],
  ['Новое предложение', /\/opportunities\/opp-dl-ecommerce\/proposals$/],
  ['Предложение просмотрено', /\/proposals\/prop-6$/],
  ['Добавили в shortlist', /\/my\/proposals$/],
  ['Начались переговоры', /\/deals\/deal-1$/],
  ['Приближается дедлайн', /\/opportunities\/opp-packaging-supply$/],
] as const

test('[NOT-01] relevant request', async ({ page }) => {
  await page.goto('/notifications')
  await expect(page.getByText('Новый подходящий заказ')).toBeVisible()
})

test('[NOT-02] new proposal', async ({ page }) => {
  await page.goto('/notifications')
  await expect(page.getByRole('heading', { name: 'Новое предложение', exact: true })).toBeVisible()
})

test('[NOT-03] proposal viewed', async ({ page }) => {
  await page.goto('/notifications')
  await expect(page.getByText('Предложение просмотрено')).toBeVisible()
})

test('[NOT-04] shortlist', async ({ page }) => {
  await page.goto('/notifications')
  await expect(page.getByRole('heading', { name: 'Добавили в shortlist', exact: true })).toBeVisible()
})

test('[NOT-06] deadline', async ({ page }) => {
  await page.goto('/notifications')
  await expect(page.getByText('Приближается дедлайн')).toBeVisible()
})

test('[NOT-07] each notification opens its entity', async ({ page }) => {
  for (const [title, url] of links) {
    await page.goto('/notifications')
    await page.getByRole('link', { name: new RegExp(title) }).click()
    await expect(page).toHaveURL(url)
  }
})

test('[NOT-08] opening a notification marks it read', async ({ page }) => {
  await page.goto('/notifications')
  await page.getByRole('link', { name: /Новый подходящий заказ/ }).click()
  await page.goto('/notifications')
  await expect(page.getByRole('link', { name: /Новый подходящий заказ/ })).not.toContainText('новое')
})

test('[NOT-09] [NOT-10] unread badge decreases', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const bell = page.getByRole('link', { name: /Уведомления, непрочитанных: \d+/ })
  await expect(bell).toBeVisible()
  const before = Number((await bell.getAttribute('aria-label'))?.match(/\d+/)?.[0])
  await bell.click()
  await page.getByRole('link', { name: /Новый подходящий заказ/ }).click()
  await page.goto('/')
  await expect(page.getByRole('link', { name: new RegExp(`непрочитанных: ${before - 1}`) })).toBeVisible()
  await page.setViewportSize({ width: 1280, height: 800 })
  await expect(
    page.getByRole('link', { name: /Уведомления/ }),
    gap('FAIL', 'на desktop шапка скрыта, бейджа и входа в уведомления нет'),
  ).toBeVisible()
})
