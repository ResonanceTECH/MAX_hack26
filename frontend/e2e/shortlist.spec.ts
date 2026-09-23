import { expect, test } from '@playwright/test'
import { cardWithAction, gap } from './helpers'

function finalist(page: import('@playwright/test').Page, name: string) {
  return cardWithAction(page, name, 'Начать переговоры')
}

test('[SHORT-01] grouped by request', async ({ page }) => {
  await page.goto('/my/shortlist')
  await expect(page.getByRole('heading', { name: 'Разработка CRM для сети клиник' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Поставка брендированной упаковки' })).toBeVisible()
  await expect(page.getByText(/Финалисты: 2/)).toBeVisible()
})

test('[SHORT-02] a shortlisted proposal appears here', async ({ page }) => {
  await page.goto('/opportunities/opp-dl-ecommerce/proposals')
  await page.getByRole('button', { name: 'В shortlist' }).click()
  await expect(page.getByText('В shortlist')).toBeVisible()
  await page.goto('/my/shortlist')
  await expect(
    page.getByRole('heading', { name: 'TechFlow' }),
    gap('FAIL', 'proposalApi.shortlist меняет статус, но не добавляет запись в shortlist'),
  ).toBeVisible()
})

test('[SHORT-03] remove stays removed', async ({ page }) => {
  await page.goto('/my/shortlist')
  await finalist(page, 'PackPro').getByRole('button', { name: 'Удалить' }).click()
  await expect(page.getByRole('heading', { name: 'PackPro' })).toHaveCount(0)
  await page.goto('/my')
  await page.goto('/my/shortlist')
  await expect(
    page.getByRole('heading', { name: 'PackPro' }),
    gap('FAIL', 'удаление живёт в useState и возвращается после ухода со страницы'),
  ).toHaveCount(0)
})

test('[SHORT-04] [SHORT-05] a note is saved', async ({ page }) => {
  await page.goto('/my/shortlist')
  await finalist(page, 'PackPro').getByRole('textbox', { name: 'Заметка' }).fill('Заметка аудита должна сохраниться')
  await page.goto('/companies')
  await page.goto('/my/shortlist')
  await expect(
    finalist(page, 'PackPro').getByRole('textbox', { name: 'Заметка' }),
    gap('FAIL', 'заметка не записывается и сбрасывается при новом монтировании'),
  ).toHaveValue('Заметка аудита должна сохраниться')
})

test('[SHORT-06] open company', async ({ page }) => {
  await page.goto('/my/shortlist')
  await finalist(page, 'DataCraft').getByRole('link', { name: 'Открыть компанию' }).click()
  await expect(page).toHaveURL(/\/companies\/company-datacraft$/)
})

test('[SHORT-07] [SHORT-08] start negotiations creates a deal', async ({ page }) => {
  await page.goto('/my/shortlist')
  await finalist(page, 'PackPro').getByRole('button', { name: 'Начать переговоры' }).click()
  await expect(page).toHaveURL(/\/deals\/deal-/)
  await expect(page.getByText('PackPro').first()).toBeVisible()
  await expect(page.getByText('Переговоры').first()).toBeVisible()
  await expect(page.getByText('Поставка брендированной упаковки')).toBeVisible()
})

test('[SHORT-09] starting negotiations twice does not duplicate the deal', async ({ page }) => {
  await page.goto('/my/shortlist')
  await finalist(page, 'PackPro').getByRole('button', { name: 'Начать переговоры' }).click()
  await expect(page).toHaveURL(/\/deals\/deal-/)
  const first = page.url()
  await page.goto('/my/shortlist')
  await finalist(page, 'PackPro').getByRole('button', { name: 'Начать переговоры' }).click()
  await expect(page).toHaveURL(/\/deals\/deal-/)
  expect(page.url(), gap('FAIL', 'каждый клик создаёт новый deal через Date.now()')).toBe(first)
})
