import { expect, test } from '@playwright/test'
import { fillProposal, gap } from './helpers'

test('[MY-01] dashboard exists', async ({ page }) => {
  await page.goto('/my')
  await expect(page.getByRole('heading', { name: 'Мои процессы' })).toBeVisible()
})

test('[MY-02] active request count matches the requests tab', async ({ page }) => {
  await page.goto('/my')
  const tab = page.getByRole('tab', { name: /Запросы \(/ })
  await expect(tab).toBeVisible()
  const count = Number((await tab.innerText()).match(/\d+/)?.[0])
  await tab.click()
  await expect(page.getByRole('link', { name: 'Подробнее' })).toHaveCount(count)
})

test('[MY-03] proposal count matches the proposals tab', async ({ page }) => {
  await page.goto('/my')
  const tab = page.getByRole('tab', { name: /Отклики \(/ })
  const count = Number((await tab.innerText()).match(/\d+/)?.[0])
  await tab.click()
  await expect(page.getByRole('link', { name: 'Подробнее' })).toHaveCount(count)
})

test('[MY-04] shortlist count matches rendered finalists', async ({ page }) => {
  await page.goto('/my')
  const tab = page.getByRole('tab', { name: /Shortlist \(/ })
  const count = Number((await tab.innerText()).match(/\d+/)?.[0])
  await page.goto('/my/shortlist')
  await expect(page.getByRole('button', { name: 'Начать переговоры' })).toHaveCount(count)
})

test('[MY-05] negotiations count matches negotiation deals', async ({ page }) => {
  await page.goto('/my')
  const tab = page.getByRole('tab', { name: /Переговоры \(/ })
  const count = Number((await tab.innerText()).match(/\d+/)?.[0])
  await tab.click()
  await expect(page.getByRole('link', { name: 'Открыть' })).toHaveCount(count)
})

test('[MY-06] requests tab', async ({ page }) => {
  await page.goto('/my')
  await page.getByRole('tab', { name: /Запросы/ }).click()
  await expect(page.getByRole('heading', { name: 'Разработка интернет-магазина' })).toBeVisible()
})

test('[MY-07] proposals tab', async ({ page }) => {
  await page.goto('/my')
  await page.getByRole('tab', { name: /Отклики/ }).click()
  await expect(page.getByText('Отправлено').first()).toBeVisible()
})

test('[MY-08] shortlist tab', async ({ page }) => {
  await page.goto('/my')
  await page.getByRole('tab', { name: /Shortlist/ }).click()
  await expect(page.getByRole('heading', { name: 'Digital Lab' }).first()).toBeVisible()
})

test('[MY-09] negotiations tab', async ({ page }) => {
  await page.goto('/my')
  await page.getByRole('tab', { name: /Переговоры/ }).click()
  await expect(page.getByText('Разработка CRM для сети клиник').first()).toBeVisible()
})

test('[MY-10] creating a proposal updates the counter', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/my')
  const tab = page.getByRole('tab', { name: /Отклики \(/ })
  const before = Number((await tab.innerText()).match(/\d+/)?.[0])
  await page.goto('/opportunities/opp-brand-video/propose')
  await fillProposal(page, 'Отклик для проверки счётчика моих процессов, минимум десять символов.')
  await page.getByRole('button', { name: 'Отправить предложение' }).click()
  await expect(page.getByRole('heading', { name: 'Предложение отправлено' })).toBeVisible()
  await page.goto('/my')
  await expect(
    page.getByRole('tab', { name: new RegExp(`Отклики \\(${before + 1}\\)`) }),
    gap('FAIL', 'счётчик откликов не обновляется: useMyProposals не инвалидируется после create'),
  ).toBeVisible()
})
