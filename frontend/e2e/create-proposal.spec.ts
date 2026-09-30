import { expect, test } from '@playwright/test'
import { cardWithAction, fillProposal, gap } from './helpers'

const DESC = 'Коммерческое предложение аудита: CRM за 40 дней с интеграцией 1С и обучением персонала.'

test('[PRC-01] form opens', async ({ page }) => {
  await page.goto('/opportunities/opp-mobile-app/propose')
  await expect(page.getByRole('heading', { name: 'Отклик на запрос' })).toBeVisible()
  await expect(page.getByLabel(/Стоимость/)).toBeVisible()
})

test('[PRC-02] price is required', async ({ page }) => {
  await page.goto('/opportunities/opp-mobile-app/propose')
  await expect(page.getByLabel(/Стоимость/)).toBeVisible()
  await page.getByRole('button', { name: 'Отправить предложение' }).click()
  await expect(page.getByText('Укажите сумму больше 0')).toBeVisible()
})

test('[PRC-03] price must be greater than zero', async ({ page }) => {
  await page.goto('/opportunities/opp-mobile-app/propose')
  await page.getByLabel(/Стоимость/).fill('0')
  await page.getByRole('button', { name: 'Отправить предложение' }).click()
  await expect(page.getByText('Укажите сумму больше 0')).toBeVisible()
  await page.getByLabel(/Стоимость/).fill('-15')
  await page.getByRole('button', { name: 'Отправить предложение' }).click()
  await expect(page.getByText('Укажите сумму больше 0')).toBeVisible()
})

test('[PRC-04] description is required', async ({ page }) => {
  await page.goto('/opportunities/opp-mobile-app/propose')
  await page.getByLabel(/Стоимость/).fill('1000')
  await page.getByLabel(/Срок, дней/).fill('10')
  await page.getByLabel('Описание предложения').fill('коротко')
  await page.getByRole('button', { name: 'Отправить предложение' }).click()
  await expect(page.getByText('Минимум 10 символов')).toBeVisible()
})

test('[PRC-05] duration is validated', async ({ page }) => {
  await page.goto('/opportunities/opp-mobile-app/propose')
  await page.getByLabel(/Срок, дней/).fill('0')
  await page.getByRole('button', { name: 'Отправить предложение' }).click()
  await expect(page.getByText('Укажите срок в днях')).toBeVisible()
})

test('[PRC-06] a case can be selected from company profile', async ({ page }) => {
  await page.goto('/opportunities/opp-mobile-app/propose')
  await expect(page.getByLabel('Релевантный кейс')).toBeVisible()
  await expect(page.getByText(/Без привязки|кейсов в профиле|Только кейс/)).toBeVisible()
})

test('[PRC-07] [PRC-08] [PRC-09] [PRC-10] [PRC-11] [PRC-12] valid proposal is stored', async ({
  page,
}) => {
  await page.goto('/opportunities/opp-mobile-app/propose')
  await fillProposal(page, DESC)
  await page.getByRole('button', { name: 'Отправить предложение' }).click()
  await expect(page.getByRole('heading', { name: 'Предложение отправлено' })).toBeVisible()
  await expect(page.getByText('Отправлено', { exact: true }).first()).toBeVisible()
  await page.getByRole('link', { name: 'Мои отклики' }).click()
  await expect(page.getByRole('heading', { name: 'Мобильное приложение для логистики' })).toBeVisible()
  await cardWithAction(page, 'Мобильное приложение для логистики', 'Открыть', 'link')
    .getByRole('link', { name: 'Открыть' })
    .click()
  await expect(page.getByText(DESC)).toBeVisible()
  await expect(page.getByText(/455\s*000/)).toBeVisible()
  await expect(page.getByText('Срок: 40 дн.')).toBeVisible()
  await expect(page.getByText('Отправлено').first()).toBeVisible()
})

test('[PRC-13] double submit does not create a duplicate', async ({ page }) => {
  await page.goto('/opportunities/opp-brand-video/propose')
  await fillProposal(page, 'Двойной клик не должен создать второе предложение по видеопродакшну.')
  const button = page.getByRole('button', { name: 'Отправить предложение' })
  await button.evaluate((node) => {
    const element = node as HTMLButtonElement
    element.click()
    element.click()
  })
  await expect(page.getByRole('heading', { name: 'Предложение отправлено' })).toBeVisible()
  await page.goto('/my/proposals')
  const created = page.getByRole('heading', { name: 'Видеопродакшн для B2B-кампании' })
  await expect(created.first(), gap('FAIL', 'отклик не появляется в «Мои отклики»')).toBeVisible()
  await expect(created, gap('FAIL', 'повторный click создаёт второй proposal')).toHaveCount(1)
})
