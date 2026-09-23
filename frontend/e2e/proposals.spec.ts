import { expect, test } from '@playwright/test'
import { cardWithAction, gap } from './helpers'

async function openCrmProposals(page: import('@playwright/test').Page) {
  await page.goto('/opportunities/opp-crm-clinics/proposals')
  await expect(page.getByRole('heading', { name: 'Предложения' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Digital Lab' })).toBeVisible()
}

test('[PROP-01] [PROP-02] list contains the proposals of the request', async ({ page }) => {
  await openCrmProposals(page)
  await expect(page.getByRole('heading', { name: 'TechFlow' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'DataCraft' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Logistics One' })).toHaveCount(0)
})

test('[PROP-03] sort by match', async ({ page }) => {
  await openCrmProposals(page)
  await expect(
    page.getByLabel('Сортировка'),
    gap('NOT_IMPLEMENTED', 'список предложений нельзя отсортировать по match'),
  ).toBeVisible()
})

test('[PROP-04] sort by price', async ({ page }) => {
  await openCrmProposals(page)
  await expect(
    page.getByRole('button', { name: /цене|стоимости/i }),
    gap('NOT_IMPLEMENTED', 'нет сортировки предложений по цене'),
  ).toBeVisible()
})

test('[PROP-05] sort by duration', async ({ page }) => {
  await openCrmProposals(page)
  await expect(
    page.getByRole('button', { name: /срок/i }),
    gap('NOT_IMPLEMENTED', 'нет сортировки предложений по сроку'),
  ).toBeVisible()
})

test('[PROP-06] [PROP-07] open proposal data', async ({ page }) => {
  await openCrmProposals(page)
  const card = cardWithAction(page, 'TechFlow', 'Подробнее', 'link')
  await card.getByRole('link', { name: 'Подробнее' }).click()
  await expect(page).toHaveURL(/\/proposals\/prop-2$/)
  await expect(page.getByText(/520\s*000/)).toBeVisible()
  await expect(page.getByText(/75 дн/)).toBeVisible()
  await expect(page.getByText(/Корпоративная CRM/)).toBeVisible()
})

test('[PROP-08] shortlist changes proposal status', async ({ page }) => {
  await openCrmProposals(page)
  const card = cardWithAction(page, 'TechFlow', 'В shortlist')
  await card.getByRole('button', { name: 'В shortlist' }).click()
  await expect(card.getByText('Просмотрено')).toHaveCount(0)
  await expect(card.getByText('В shortlist').first()).toBeVisible()
})

test('[PROP-09] reject changes proposal status', async ({ page }) => {
  await openCrmProposals(page)
  const card = cardWithAction(page, 'Digital Lab', 'Отклонить')
  await card.getByRole('button', { name: 'Отклонить' }).click()
  await expect(card.getByText('Отклонено')).toBeVisible()
})

test('[PROP-10] shortlisted filter', async ({ page }) => {
  await openCrmProposals(page)
  await expect(
    page.getByRole('checkbox', { name: /shortlist/i }),
    gap('NOT_IMPLEMENTED', 'нет фильтра shortlisted на списке предложений'),
  ).toBeVisible()
})

test('[PROP-11] empty state', async ({ page }) => {
  await page.goto('/opportunities/opp-brand-video/proposals')
  await expect(page.getByText('Пока нет предложений')).toBeVisible()
})
