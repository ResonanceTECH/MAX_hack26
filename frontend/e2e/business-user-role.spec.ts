import { expect, test } from '@playwright/test'
import { fillProposal, gap, reachOpportunityForm } from './helpers'

test('[ROLE-01] [ROLE-02] [ROLE-03] [ROLE-04] [ROLE-05] one company profile does both jobs', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await page.goto('/profile/company')
  await expect(page.getByText(/Анна Смирнова/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Digital Lab' })).toBeVisible()
  await expect(page.getByText(/заказчик|contractor|customer account/i)).toHaveCount(0)
  await page.goto('/opportunities/create')
  await reachOpportunityForm(page)
  await page.getByLabel('Название').fill('Роль: свой запрос Digital Lab')
  await page.getByRole('button', { name: 'К предпросмотру' }).click()
  await page.getByRole('button', { name: 'Опубликовать' }).click()
  await expect(page.getByRole('heading', { name: 'Запрос опубликован' })).toBeVisible()
  await page.goto('/opportunities/opp-mobile-app/propose')
  await expect(page.getByText('От имени Digital Lab')).toBeVisible()
  await fillProposal(page, 'Тот же Business User откликается на чужой запрос без смены аккаунта.')
  await page.getByRole('button', { name: 'Отправить предложение' }).click()
  await expect(page.getByRole('heading', { name: 'Предложение отправлено' })).toBeVisible()
  await page.goto('/profile/company')
  await expect(page.getByText(/Анна Смирнова/)).toBeVisible()
  await expect(page.getByRole('link', { name: /войти как/i })).toHaveCount(0)
})

test('[ROLE-06] another company cannot be edited', async ({ page }) => {
  await page.goto('/companies/company-techflow')
  await expect(page.getByRole('button', { name: /редактир/i })).toHaveCount(0)
  await expect(page.getByRole('textbox')).toHaveCount(0)
})

test('[ROLE-07] another request cannot be edited', async ({ page }) => {
  await page.goto('/opportunities/opp-crm-clinics')
  await expect(page.getByRole('button', { name: /редактир/i })).toHaveCount(0)
  await expect(page.getByRole('textbox')).toHaveCount(0)
})

test('[ROLE-08] another proposal cannot be changed', async ({ page }) => {
  await page.goto('/proposals/prop-2')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText(/520\s*000/)).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'В shortlist' }),
    gap('FAIL', 'Business User меняет чужой proposal на чужом запросе'),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Отклонить' }),
    gap('FAIL', 'Business User отклоняет чужой proposal'),
  ).toHaveCount(0)
})

test('[ROLE-09] another company shortlist is not available', async ({ page }) => {
  await page.goto('/my/shortlist')
  await expect(page.getByRole('heading', { level: 1, name: 'Shortlist' })).toBeVisible()
  await expect(page.getByText(/Финалисты:/).first()).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Разработка CRM для сети клиник' }),
    gap('FAIL', 'shortlist показывает финалистов чужого запроса МедСнаб'),
  ).toHaveCount(0)
})

test('[ROLE-10] admin surface is closed', async ({ page }) => {
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
  await page.goto('/')
  await expect(page.getByRole('link', { name: /админ/i })).toHaveCount(0)
})
